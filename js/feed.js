/* ===================================================
   게임 피드 (릴스/쇼츠형)
   ---------------------------------------------------
   공식 게임(js/games.js) + 유저가 올린 게임(Firestore)을
   한 화면에 하나씩 보여줍니다.

   동작 원칙
   - 시작 전(포스터): 위아래로 밀어 넘깁니다.
   - "탭해서 시작"을 누르면 그 슬라이드에만 iframe을 띄우고, 피드 스크롤을 잠급니다.
     (게임이 터치를 가져가므로, 나가기/다음 버튼으로만 빠져나옵니다.)
   - iframe은 언제나 하나만 둡니다. 나가면 바로 지워 메모리를 돌려줍니다.
   - 유저 게임은 다른 주소(플레이 Worker)에서, sandbox iframe으로 띄웁니다.

   플랫폼(js/platform.js)이 늦게 뜨거나 실패해도 공식 게임은 바로 보입니다.
   그동안 좋아요는 이 기기에만 저장됩니다.

   게임 → 피드 메시지 (선택, 게임이 보내 주면 기록이 남습니다)
     parent.postMessage({ type: "mobs:score", score: 1234 }, "*")  // 점수 (클수록 좋음)
     parent.postMessage({ type: "mobs:end" }, "*")                  // 한 판 끝 → "다음" 버튼 강조

   저장 (이 기기에만, localStorage "feed:v1")
     liked: { id: true } (플랫폼 없을 때만), best: { id: 점수 }, plays: { id: 횟수 }
   =================================================== */

(function () {
  "use strict";

  const feed  = document.getElementById("feed");
  const toast = document.getElementById("toast");

  const DAY = 24 * 60 * 60 * 1000;

  const OFFICIAL = (typeof GAMES !== "undefined" ? GAMES : [])
    .filter(g => g.status === "web" && g.playable && g.play && g.portrait)
    .map(g => ({
      id: g.slug,
      official: true,
      title: g.title,
      desc: g.desc,
      tags: g.genres || [],
      play: g.play,
      big: "/play/?g=" + encodeURIComponent(g.slug),
      about: g.about || "",
      thumb: g.thumb || "",
      accent: g.accent || "",
      likeCount: 0,
      playCount: 0
    }));
  let USER = [];
  const byId = id => OFFICIAL.find(g => g.id === id) || USER.find(g => g.id === id);

  let P = null;                 // window.MobsPlatform (준비되면)
  let remoteLiked = null;       // Set — 플랫폼에서 받은 내 좋아요
  let mySubs = new Set();       // 내가 구독한 사람 (uid, 공식은 "mobs")

  const creatorOf = g => g.official ? "mobs" : g.ownerUid;

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
  function isLiked(id) { return remoteLiked ? remoteLiked.has(id) : !!store.liked[id]; }

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

  function count(n) {
    return n >= 10000 ? (n / 10000).toFixed(n >= 100000 ? 0 : 1) + "만"
         : n >= 1000  ? (n / 1000).toFixed(1) + "천"
         : String(n);
  }

  function bestText(id) {
    const b = store.best[id];
    return b != null ? "🏆 내 최고 " + Number(b).toLocaleString("ko-KR") : "✨ 첫 기록에 도전!";
  }

  /* 만든 사람 — 누르면 그 사람 프로필(/u/) */
  function subBtn(g) {
    const cid = creatorOf(g);
    if (!cid || (P && P.user && P.user.uid === cid)) return "";   // 내 게임엔 구독 버튼 없음
    const on = mySubs.has(cid);
    return ' <button class="sub-btn' + (on ? " on" : "") + '" data-act="sub" data-cid="' + esc(cid) + '">' +
      (on ? "구독중" : "구독") + "</button>";
  }

  function byline(g) {
    if (g.official) return '<p class="by"><a href="/u/?id=mobs">@모브스</a> · 공식' + subBtn(g) + "</p>";
    const d = new Date(g.createdAt);
    const date = (d.getMonth() + 1) + "월 " + d.getDate() + "일";
    const who = '<a href="/u/?id=' + encodeURIComponent(g.ownerUid) + '">@' + esc(g.ownerName || "이름 없음") + "</a>";
    return '<p class="by">' + who + " · " + date + " 공개" + subBtn(g) + "</p>";
  }

  const ICON = {
    heart: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.6C1.5 7.4 3.8 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.4 0 5.7 3.4 4.5 6.9-1.8 5-9.3 9.6-9.3 9.6z"/></svg>',
    share: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v14"/></svg>',
    info:  '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/></svg>',
    full:  '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>',
    flag:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>'
  };

  /* ---------- 슬라이드 만들기 ---------- */

  function slideHTML(g, i) {
    const thumb = g.thumb
      ? '<img class="shot" src="' + esc(g.thumb) + '" alt="" ' + (i > 1 ? 'loading="lazy"' : "") + ">"
      : '<div class="initial">' + esc(g.title.charAt(0)) + "</div>";
    const tags = (g.tags || []).map(t => "#" + esc(t)).join(" ");
    const liked = isLiked(g.id);
    const fresh = !g.official && Date.now() - g.createdAt < DAY;

    return (
      '<section class="slide" data-id="' + esc(g.id) + '"' +
        (g.accent ? ' style="--accent:' + esc(g.accent) + '"' : "") + ">" +
        '<div class="col">' +
          (g.thumb ? '<div class="blur" style="background-image:url(\'' + esc(g.thumb) + '\')"></div>' : "") +
          '<button class="poster" data-act="start" aria-label="' + esc(g.title) + ' 시작">' +
            thumb +
            '<span class="start-btn">👆 탭해서 시작</span>' +
            (i === 0 ? '<span class="swipe-hint">↑ 밀어서 다음 게임</span>' : "") +
          "</button>" +
          '<div class="info">' +
            "<h2>" + esc(g.title) + (fresh ? ' <span class="new">NEW</span>' : "") + "</h2>" +
            byline(g) +
            (g.desc ? '<p class="desc">' + esc(g.desc) + "</p>" : "") +
            '<p class="best">' + bestText(g.id) + "</p>" +
            (tags ? '<p class="tags">' + tags + "</p>" : "") +
          "</div>" +
          '<div class="rail">' +
            '<button class="rail-btn' + (liked ? " liked" : "") + '" data-act="like" aria-pressed="' + liked + '">' +
              '<span class="ic">' + ICON.heart + '</span><span class="n">' + (g.likeCount ? count(g.likeCount) : "좋아요") + "</span></button>" +
            '<button class="rail-btn" data-act="share"><span class="ic">' + ICON.share + "</span>공유</button>" +
            (g.about ? '<a class="rail-btn" href="' + esc(g.about) + '"><span class="ic">' + ICON.info + "</span>소개</a>" : "") +
            (g.official ? "" : '<button class="rail-btn" data-act="report"><span class="ic">' + ICON.flag + "</span>신고</button>") +
            '<a class="rail-btn" href="' + esc(g.big) + '"' + (g.official ? "" : ' target="_blank" rel="noopener"') +
              '><span class="ic">' + ICON.full + "</span>크게</a>" +
          "</div>" +
        "</div>" +
      "</section>"
    );
  }

  function endHTML(kind) {
    const body =
      kind === "subs"
        ? (P && P.isMember()
            ? "<h2>구독한 사람의 게임이 없어요</h2><p>게임 아래 이름 옆 “구독”을 누르면 그 사람의 새 게임이 여기 모여요.</p>"
            : "<h2>좋아하는 제작자를 구독해 보세요</h2><p>구글로 로그인하고 “구독”을 누르면 그 사람의 새 게임이 여기 모여요.</p>") +
          '<div class="acts"><button class="bar-btn next" data-act="tab" data-tab="all">추천 보기</button></div>'
      : kind === "liked"
        ? "<h2>좋아요한 게임이 없어요</h2><p>마음에 드는 게임에 ♥를 눌러 보세요.</p>" +
          '<div class="acts"><button class="bar-btn next" data-act="tab" data-tab="all">추천 보기</button></div>'
      : kind === "new"
        ? "<h2>아직 올라온 게임이 없어요</h2><p>직접 만든 게임을 첫 번째로 올려 보세요.</p>" +
          '<div class="acts"><a class="bar-btn next" href="/upload/">게임 올리기</a>' +
          '<button class="bar-btn" data-act="tab" data-tab="all">추천 보기</button></div>'
      : "<h2>다 봤어요!</h2><p>새 게임이 올라오면 신규 탭에 먼저 뜹니다.</p>" +
        '<div class="acts">' +
          '<button class="bar-btn" data-act="top">처음부터</button>' +
          '<button class="bar-btn next" data-act="tab" data-tab="random">랜덤으로 더 보기</button>' +
          '<a class="bar-btn" href="/upload/">내 게임 올리기</a>' +
        "</div>";
    const legal = '<p class="legal"><a href="/feed/terms.html">이용약관</a> · <a href="/feed/privacy-policy.html">개인정보 처리방침</a></p>';
    return '<section class="slide" data-end="1"><div class="col"><div class="end">' + body + legal + "</div></div></section>";
  }

  /* ---------- 탭 ---------- */

  let list = [];
  let tab = "all";

  function newest() { return USER.slice().sort((a, b) => b.createdAt - a.createdAt); }

  /* 추천: 공식 게임과 새 게임을 번갈아 */
  function mixed() {
    const a = OFFICIAL, b = newest(), out = [];
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i]) out.push(a[i]);
      if (b[i]) out.push(b[i]);
    }
    return out;
  }

  function render(nextTab, focusId) {
    stop();
    tab = nextTab;
    document.querySelectorAll(".tab").forEach(b => {
      const on = b.dataset.tab === tab;
      b.classList.toggle("on", on);
      b.setAttribute("aria-selected", on);
    });

    const everything = OFFICIAL.concat(USER);
    list = tab === "subs"   ? newest().filter(g => mySubs.has(g.ownerUid))
                                .concat(mySubs.has("mobs") ? OFFICIAL : [])
         : tab === "random" ? shuffle(everything)
         : tab === "new"    ? newest()
         : tab === "hot"    ? everything.slice().sort((a, b) => (b.likeCount - a.likeCount) || (b.playCount - a.playCount))
         : tab === "liked"  ? everything.filter(g => isLiked(g.id))
         : mixed();

    feed.innerHTML = list.map(slideHTML).join("") +
      endHTML(list.length ? "end" : tab === "new" ? "new" : tab === "subs" ? "subs" : "liked");
    current = null;
    feed.scrollTop = 0;
    observe();

    if (focusId) {
      const el = slideOf(focusId);
      if (el) feed.scrollTop = el.offsetTop;
    }
  }

  function slideOf(id) {
    return feed.querySelector('.slide[data-id="' + CSS.escape(id) + '"]');
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
        const id = current.dataset.id;
        if (id) history.replaceState(null, "", "#" + id);
        if (current !== feed.firstElementChild) {
          const hint = feed.querySelector(".swipe-hint");
          if (hint) hint.classList.add("gone");
        }
      });
    }, { root: feed, threshold: 0.6 });
    feed.querySelectorAll(".slide").forEach(s => io.observe(s));
  }

  function go(delta) {
    const from = current || feed.firstElementChild;
    const target = delta > 0 ? from.nextElementSibling : from.previousElementSibling;
    if (target) feed.scrollTo({ top: target.offsetTop, behavior: "smooth" });
  }

  /* ---------- 플레이 ---------- */

  let playing = null;   // { slide, frame, id }

  function start(slide) {
    const g = byId(slide.dataset.id);
    if (!g) return;
    stop();

    const player = document.createElement("div");
    player.className = "player";
    player.innerHTML =
      '<div class="play-bar">' +
        '<button class="bar-btn" data-act="stop" aria-label="그만하기">✕</button>' +
        '<span class="t">' + esc(g.title) + "</span>" +
        (slide.nextElementSibling && slide.nextElementSibling.dataset.id
          ? '<button class="bar-btn next" data-act="next">다음 ↓</button>' : "") +
      "</div>" +
      '<div class="frame-wrap"><div class="loading"><span>불러오는 중</span></div></div>';

    const frame = document.createElement("iframe");
    frame.title = g.title;
    frame.allow = "autoplay; fullscreen; gamepad; accelerometer; gyroscope";
    if (!g.official) {
      // 유저 게임: 다른 주소 + sandbox. 팝업·상단 이동·폼 제출은 막습니다.
      frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-pointer-lock allow-orientation-lock");
      frame.referrerPolicy = "no-referrer";
    }
    frame.src = g.play;
    frame.addEventListener("load", () => {
      const l = player.querySelector(".loading");
      if (l) l.classList.add("gone");
    });
    player.querySelector(".frame-wrap").appendChild(frame);
    slide.querySelector(".col").appendChild(player);

    playing = { slide, frame, id: g.id };
    feed.classList.add("locked");
    document.body.classList.add("is-playing");

    store.plays[g.id] = (store.plays[g.id] || 0) + 1;
    save();
    if (P) P.addPlay(g.id).then(() => { g.playCount++; }, () => {});
    frame.focus();
  }

  function stop() {
    if (!playing) return;
    const p = playing.slide.querySelector(".player");
    if (p) p.remove();                    // iframe도 함께 사라집니다
    const best = playing.slide.querySelector(".best");
    if (best) best.textContent = bestText(playing.id);
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
      const prev = store.best[playing.id];
      if (prev == null || d.score > prev) {
        store.best[playing.id] = d.score;
        save();
        if (prev != null) say("🏆 최고 기록 갱신!");
      }
    } else if (d.type === "mobs:end") {
      const next = playing.slide.querySelector(".bar-btn.next");
      if (next) next.classList.add("ping");
    }
  });

  /* ---------- 좋아요 / 공유 / 신고 ---------- */

  function paintLike(btn, g, on) {
    btn.classList.toggle("liked", on);
    btn.setAttribute("aria-pressed", on);
    btn.querySelector(".n").textContent = g.likeCount ? count(g.likeCount) : "좋아요";
  }

  async function toggleLike(btn, id) {
    const g = byId(id);
    if (!g) return;
    const on = !isLiked(id);

    if (!P || !remoteLiked) {                        // 플랫폼 없이: 이 기기에만
      if (on) store.liked[id] = true; else delete store.liked[id];
      save();
      paintLike(btn, g, on);
      say(on ? "좋아요에 담았어요" : "좋아요를 취소했어요");
      return;
    }

    // 먼저 화면에 반영하고, 실패하면 되돌립니다.
    if (on) remoteLiked.add(id); else remoteLiked.delete(id);
    g.likeCount = Math.max(0, g.likeCount + (on ? 1 : -1));
    paintLike(btn, g, on);
    btn.disabled = true;
    try {
      await P.setLike(id, on);
      say(on ? "좋아요에 담았어요" : "좋아요를 취소했어요");
    } catch (e) {
      if (on) remoteLiked.delete(id); else remoteLiked.add(id);
      g.likeCount = Math.max(0, g.likeCount + (on ? -1 : 1));
      paintLike(btn, g, !on);
      say("잠시 후 다시 눌러 주세요");
    } finally {
      btn.disabled = false;
    }
  }

  function share(id) {
    const g = byId(id);
    const url = location.origin + "/feed/#" + encodeURIComponent(id);
    if (navigator.share) {
      navigator.share({ title: g ? g.title : "모브스 게임", url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => say("링크를 복사했어요"), () => say(url));
    } else {
      say(url);
    }
  }

  async function toggleSub(btn) {
    if (!P) { say("잠시 후 다시 눌러 주세요"); return; }
    if (!P.isMember()) {
      if (!confirm("구독하려면 구글 로그인이 필요해요. 로그인할까요?")) return;
      try { await P.signInGoogle(); location.reload(); } catch (e) { /* 창을 닫음 */ }
      return;
    }
    const cid = btn.dataset.cid;
    const on = !mySubs.has(cid);
    btn.disabled = true;
    try {
      await P.setSubscribe(cid, on);
      if (on) mySubs.add(cid); else mySubs.delete(cid);
      // 같은 사람의 다른 슬라이드 버튼도 함께 바꿉니다.
      feed.querySelectorAll('.sub-btn[data-cid="' + CSS.escape(cid) + '"]').forEach(b => {
        b.classList.toggle("on", on);
        b.textContent = on ? "구독중" : "구독";
      });
      say(on ? "구독했어요 — 구독 탭에서 새 게임을 볼 수 있어요" : "구독을 취소했어요");
    } catch (e) {
      say("잠시 후 다시 눌러 주세요");
    } finally {
      btn.disabled = false;
    }
  }

  async function report(id) {
    if (!P) { say("잠시 후 다시 눌러 주세요"); return; }
    const reason = prompt("이 게임을 신고할까요?\n이유를 적어 주시면 확인에 도움이 됩니다. (선택)", "");
    if (reason === null) return;
    try {
      await P.report(id, reason);
      say("신고했어요. 확인 후 조치할게요");
    } catch (e) {
      say(e && e.code === "permission-denied" ? "이미 신고한 게임이에요" : "신고하지 못했어요");
    }
  }

  /* ---------- 클릭 한 곳에서 처리 ---------- */

  feed.addEventListener("click", e => {
    const el = e.target.closest("[data-act]");
    if (!el) return;
    const slide = el.closest(".slide");
    switch (el.dataset.act) {
      case "start":  start(slide); break;
      case "stop":   stop(); break;
      case "next":   stop(); go(1); break;
      case "like":   toggleLike(el, slide.dataset.id); break;
      case "share":  share(slide.dataset.id); break;
      case "report": report(slide.dataset.id); break;
      case "sub":    toggleSub(el); break;
      case "top":    feed.scrollTo({ top: 0, behavior: "smooth" }); break;
      case "tab":    render(el.dataset.tab); break;
    }
  });

  /* 키보드: ↑↓ / j k 로 넘기기, Esc로 나가기 */
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && playing) { stop(); return; }
    if (playing || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === "j") { e.preventDefault(); go(1); }
    if (e.key === "ArrowUp"   || e.key === "PageUp"   || e.key === "k") { e.preventDefault(); go(-1); }
  });

  /* ---------- 시작 ---------- */

  const hashId = () => decodeURIComponent(location.hash.slice(1)) || null;

  // 공식 게임은 바로 보여 줍니다.
  render("all", hashId());

  window.addEventListener("hashchange", () => {
    const id = hashId();
    const el = id && slideOf(id);
    if (el) { stop(); feed.scrollTop = el.offsetTop; }
    else if (id && byId(id)) render("all", id);
  });

  // 플랫폼이 뜨면 유저 게임·좋아요 수·내 좋아요를 붙입니다.
  async function connect() {
    P = window.MobsPlatform;
    try {
      // 내 좋아요를 못 읽어도(익명 로그인 실패 등) 게임 목록은 보여 줍니다.
      const [data, liked, subs] = await Promise.all([P.loadFeed(), P.myLikes().catch(e => {
        console.warn("좋아요를 불러오지 못했어요. 이 기기에만 저장합니다.", e);
        return null;
      }), P.mySubscriptions().catch(() => [])]);
      mySubs = new Set(subs);
      OFFICIAL.forEach(g => {
        const s = data.official[g.id];
        if (s) { g.likeCount = s.likeCount; g.playCount = s.playCount; }
      });
      USER = data.userGames.map(u => ({
        id: u.id,
        official: false,
        title: u.title,
        desc: u.desc,
        tags: u.tags,
        play: P.playUrl(u.id),
        big: P.playUrl(u.id),
        about: "",
        thumb: u.thumb,
        accent: "",
        ownerName: u.ownerName,
        ownerUid: u.ownerUid,
        createdAt: u.createdAt,
        likeCount: u.likeCount,
        playCount: u.playCount
      }));
      remoteLiked = liked;
    } catch (e) {
      console.warn("플랫폼에 연결하지 못했어요. 공식 게임만 보여 줍니다.", e);
      P = null;
      return;
    }

    // 게임을 하는 중이면 끝날 때까지 기다렸다가 다시 그립니다.
    const redraw = () => render(tab, (current && current.dataset.id) || hashId());
    if (playing) {
      const wait = setInterval(() => { if (!playing) { clearInterval(wait); redraw(); } }, 500);
    } else {
      redraw();
    }
  }

  if (window.MobsPlatform) connect();
  else window.addEventListener("mobs-platform-ready", connect, { once: true });
})();
