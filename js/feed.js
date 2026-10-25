/* ===================================================
   게임 피드 (릴스/쇼츠형)
   ---------------------------------------------------
   js/games.js의 GAMES에서 "브라우저에서 바로 플레이 가능한 세로 게임"만 모아
   한 화면에 하나씩 보여줍니다.

   동작 원칙
   - 시작 전(포스터): 위아래로 밀어 넘깁니다.
   - "탭해서 시작"을 누르면 그 슬라이드에만 iframe을 띄우고, 피드 스크롤을 잠급니다.
     (게임이 터치를 가져가므로, 나가기/다음 버튼으로만 빠져나옵니다.)
   - iframe은 언제나 하나만 둡니다. 나가면 바로 지워 메모리를 돌려줍니다.

   게임 → 피드 메시지 (선택, 게임이 보내 주면 기록이 남습니다)
     parent.postMessage({ type: "mobs:score", score: 1234 }, "*")  // 점수 (클수록 좋음)
     parent.postMessage({ type: "mobs:end" }, "*")                  // 한 판 끝 → "다음" 버튼 강조

   저장 (이 기기에만, localStorage "feed:v1")
     liked: { slug: true }, best: { slug: 점수 }, plays: { slug: 횟수 }
   =================================================== */

(function () {
  "use strict";

  const feed  = document.getElementById("feed");
  const toast = document.getElementById("toast");

  const ALL = (typeof GAMES !== "undefined" ? GAMES : []).filter(
    g => g.status === "web" && g.playable && g.play && g.portrait
  );

  /* ---------- 저장 ---------- */

  const STORE_KEY = "feed:v1";
  const store = (function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY)) || {};
      return { liked: s.liked || {}, best: s.best || {}, plays: s.plays || {} };
    } catch (e) {
      return { liked: {}, best: {}, plays: {} };
    }
  })();
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* 사생활 보호 모드 등 */ }
  }

  /* ---------- 도우미 ---------- */

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  let toastTimer = 0;
  function say(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1600);
  }

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function bestText(slug) {
    const b = store.best[slug];
    return b != null ? "🏆 내 최고 " + Number(b).toLocaleString("ko-KR") : "✨ 첫 기록에 도전!";
  }

  const ICON = {
    heart: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.6C1.5 7.4 3.8 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.4 0 5.7 3.4 4.5 6.9-1.8 5-9.3 9.6-9.3 9.6z"/></svg>',
    share: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v14"/></svg>',
    info:  '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/></svg>',
    full:  '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>'
  };

  /* ---------- 슬라이드 만들기 ---------- */

  function slideHTML(g, i) {
    const thumb = g.thumb
      ? '<img class="shot" src="' + esc(g.thumb) + '" alt="" ' + (i > 1 ? 'loading="lazy"' : "") + ">"
      : '<div class="initial">' + esc(g.title.charAt(0)) + "</div>";
    const tags = (g.genres || []).map(t => "#" + esc(t)).join(" ");
    const liked = !!store.liked[g.slug];

    return (
      '<section class="slide" data-slug="' + esc(g.slug) + '" style="--accent:' + esc(g.accent || "#5eead4") + '">' +
        '<div class="col">' +
          (g.thumb ? '<div class="blur" style="background-image:url(\'' + esc(g.thumb) + '\')"></div>' : "") +
          '<button class="poster" data-act="start" aria-label="' + esc(g.title) + ' 시작">' +
            thumb +
            '<span class="start-btn">👆 탭해서 시작</span>' +
            (i === 0 ? '<span class="swipe-hint">↑ 밀어서 다음 게임</span>' : "") +
          "</button>" +
          '<div class="info">' +
            "<h2>" + esc(g.title) + "</h2>" +
            '<p class="desc">' + esc(g.desc) + "</p>" +
            '<p class="best">' + bestText(g.slug) + "</p>" +
            (tags ? '<p class="tags">' + tags + "</p>" : "") +
          "</div>" +
          '<div class="rail">' +
            '<button class="rail-btn' + (liked ? " liked" : "") + '" data-act="like" aria-pressed="' + liked + '">' +
              '<span class="ic">' + ICON.heart + "</span>좋아요</button>" +
            '<button class="rail-btn" data-act="share"><span class="ic">' + ICON.share + "</span>공유</button>" +
            (g.about ? '<a class="rail-btn" href="' + esc(g.about) + '"><span class="ic">' + ICON.info + "</span>소개</a>" : "") +
            '<a class="rail-btn" href="/play/?g=' + encodeURIComponent(g.slug) + '"><span class="ic">' + ICON.full + "</span>크게</a>" +
          "</div>" +
        "</div>" +
      "</section>"
    );
  }

  function endHTML(kind) {
    const body = kind === "empty"
      ? "<h2>좋아요한 게임이 없어요</h2><p>마음에 드는 게임에 ♥를 눌러 보세요.</p>" +
        '<div class="acts"><button class="bar-btn next" data-act="tab" data-tab="all">추천 보기</button></div>'
      : "<h2>다 봤어요!</h2><p>새 게임이 올라오면 여기에 먼저 뜹니다.</p>" +
        '<div class="acts">' +
          '<button class="bar-btn" data-act="top">처음부터</button>' +
          '<button class="bar-btn next" data-act="tab" data-tab="random">랜덤으로 더 보기</button>' +
          '<a class="bar-btn" href="/">목록 보기</a>' +
        "</div>";
    return '<section class="slide" data-end="1"><div class="col"><div class="end">' + body + "</div></div></section>";
  }

  /* ---------- 탭 ---------- */

  let list = [];
  let tab = "all";

  function render(nextTab, focusSlug) {
    stop();
    tab = nextTab;
    document.querySelectorAll(".tab").forEach(b => {
      const on = b.dataset.tab === tab;
      b.classList.toggle("on", on);
      b.setAttribute("aria-selected", on);
    });

    list = tab === "random" ? shuffle(ALL)
         : tab === "liked"  ? ALL.filter(g => store.liked[g.slug])
         : ALL.slice();

    feed.innerHTML = list.map(slideHTML).join("") + endHTML(list.length ? "end" : "empty");
    current = null;
    feed.scrollTop = 0;
    observe();

    if (focusSlug) {
      const el = feed.querySelector('.slide[data-slug="' + CSS.escape(focusSlug) + '"]');
      if (el) feed.scrollTop = el.offsetTop;
    }
  }

  document.querySelector(".tabs").addEventListener("click", e => {
    const b = e.target.closest(".tab");
    if (b && b.dataset.tab !== tab) render(b.dataset.tab);
  });

  /* ---------- 지금 보이는 슬라이드 ---------- */

  let current = null;
  let io = null;

  function observe() {
    if (io) io.disconnect();
    io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        current = en.target;
        const slug = current.dataset.slug;
        if (slug) history.replaceState(null, "", "#" + slug);
        if (current !== feed.firstElementChild) {
          const hint = feed.querySelector(".swipe-hint");
          if (hint) hint.classList.add("gone");
        }
      });
    }, { root: feed, threshold: 0.6 });
    feed.querySelectorAll(".slide").forEach(s => io.observe(s));
  }

  function go(delta) {
    const target = delta > 0 ? (current || feed.firstElementChild).nextElementSibling
                             : (current || feed.firstElementChild).previousElementSibling;
    if (target) feed.scrollTo({ top: target.offsetTop, behavior: "smooth" });
  }

  /* ---------- 플레이 ---------- */

  let playing = null;   // { slide, frame, slug }

  function start(slide) {
    const g = ALL.find(x => x.slug === slide.dataset.slug);
    if (!g) return;
    stop();

    const player = document.createElement("div");
    player.className = "player";
    player.innerHTML =
      '<div class="play-bar">' +
        '<button class="bar-btn" data-act="stop" aria-label="그만하기">✕</button>' +
        '<span class="t">' + esc(g.title) + "</span>" +
        (slide.nextElementSibling && slide.nextElementSibling.dataset.slug
          ? '<button class="bar-btn next" data-act="next">다음 ↓</button>' : "") +
      "</div>" +
      '<div class="frame-wrap"><div class="loading"><span>불러오는 중</span></div></div>';

    const frame = document.createElement("iframe");
    frame.src = g.play;
    frame.title = g.title;
    frame.allow = "autoplay; fullscreen; gamepad; accelerometer; gyroscope";
    frame.addEventListener("load", () => {
      const l = player.querySelector(".loading");
      if (l) l.classList.add("gone");
    });
    player.querySelector(".frame-wrap").appendChild(frame);
    slide.querySelector(".col").appendChild(player);

    playing = { slide, frame, slug: g.slug };
    feed.classList.add("locked");
    document.body.classList.add("is-playing");

    store.plays[g.slug] = (store.plays[g.slug] || 0) + 1;
    save();
    frame.focus();
  }

  function stop() {
    if (!playing) return;
    const p = playing.slide.querySelector(".player");
    if (p) p.remove();                    // iframe도 함께 사라집니다
    const best = playing.slide.querySelector(".best");
    if (best) best.textContent = bestText(playing.slug);
    playing = null;
    feed.classList.remove("locked");
    document.body.classList.remove("is-playing");
  }

  /* 게임이 보내는 점수/종료 신호 — 지금 띄운 iframe에서 온 것만 받습니다. */
  window.addEventListener("message", e => {
    if (!playing || e.source !== playing.frame.contentWindow) return;
    const d = e.data;
    if (!d || typeof d !== "object") return;

    if (d.type === "mobs:score" && Number.isFinite(d.score)) {
      const prev = store.best[playing.slug];
      if (prev == null || d.score > prev) {
        store.best[playing.slug] = d.score;
        save();
        if (prev != null) say("🏆 최고 기록 갱신!");
      }
    } else if (d.type === "mobs:end") {
      const next = playing.slide.querySelector(".bar-btn.next");
      if (next) next.classList.add("ping");
    }
  });

  /* ---------- 좋아요 / 공유 ---------- */

  function toggleLike(btn, slug) {
    const on = !store.liked[slug];
    if (on) store.liked[slug] = true; else delete store.liked[slug];
    save();
    btn.classList.toggle("liked", on);
    btn.setAttribute("aria-pressed", on);
    say(on ? "좋아요에 담았어요" : "좋아요를 취소했어요");
  }

  function share(slug) {
    const g = ALL.find(x => x.slug === slug);
    const url = location.origin + "/feed/#" + encodeURIComponent(slug);
    if (navigator.share) {
      navigator.share({ title: g ? g.title : "모브스 게임", url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => say("링크를 복사했어요"), () => say(url));
    } else {
      say(url);
    }
  }

  /* ---------- 클릭 한 곳에서 처리 ---------- */

  feed.addEventListener("click", e => {
    const el = e.target.closest("[data-act]");
    if (!el) return;
    const slide = el.closest(".slide");
    switch (el.dataset.act) {
      case "start": start(slide); break;
      case "stop":  stop(); break;
      case "next":  stop(); go(1); break;
      case "like":  toggleLike(el, slide.dataset.slug); break;
      case "share": share(slide.dataset.slug); break;
      case "top":   feed.scrollTo({ top: 0, behavior: "smooth" }); break;
      case "tab":   render(el.dataset.tab); break;
    }
  });

  /* 키보드: ↑↓ / j k 로 넘기기, Esc로 나가기 */
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && playing) { stop(); return; }
    if (playing || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === "j") { e.preventDefault(); go(1); }
    if (e.key === "ArrowUp"   || e.key === "PageUp"   || e.key === "k") { e.preventDefault(); go(-1); }
  });

  /* ---------- 시작: 주소 뒤 #slug가 있으면 그 게임부터 ---------- */

  render("all", decodeURIComponent(location.hash.slice(1)) || null);

  /* 이미 피드에 있는데 #slug 링크를 눌렀을 때 (replaceState는 이 이벤트를 부르지 않습니다) */
  window.addEventListener("hashchange", () => {
    const slug = decodeURIComponent(location.hash.slice(1));
    const el = slug && feed.querySelector('.slide[data-slug="' + CSS.escape(slug) + '"]');
    if (el) { stop(); feed.scrollTop = el.offsetTop; }
    else if (slug && ALL.some(g => g.slug === slug)) render("all", slug);
  });
})();
