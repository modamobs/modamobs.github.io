/* ===================================================
   계정 버튼 (메인·피드 오른쪽 위)
   ---------------------------------------------------
   <div data-account></div> 자리에 그립니다.
     - 로그인 전: "로그인" 버튼 → 구글 로그인 팝업
     - 로그인 후: 알림 종(구독한 사람의 새 게임, 안 읽은 수) + 프로필 사진 → 메뉴
                  (내 페이지 / 내가 올린 게임 / 게임 올리기 / 로그아웃)
   data-account="round"  : 피드처럼 어두운 화면 위의 동그란 버튼
   data-reload           : 로그인·로그아웃 뒤 페이지를 다시 읽음 (피드의 좋아요를 새 계정으로 맞추려고)

   js/platform.js(Firebase)는 첫 화면을 다 그린 뒤에 불러옵니다.
   이미 페이지에 platform.js가 있으면(피드) 그것을 기다립니다.
   익명 로그인은 하지 않습니다 — 메인을 보기만 해서 계정이 생기지 않게.
   =================================================== */

(function () {
  "use strict";

  const slot = document.querySelector("[data-account]");
  if (!slot) return;

  const PLATFORM_URL = "/js/platform.js?v=7";
  const round = slot.dataset.account === "round";

  /* ---------- 스타일 (두 페이지 공용, 각 페이지 색을 따라감) ---------- */

  const css = document.createElement("style");
  css.textContent = `
    .acct { position: relative; flex: none; display: flex; align-items: center; gap: 8px; }
    .acct-bell {
      position: relative; width: 36px; height: 36px; padding: 0; border-radius: 50%; cursor: pointer;
      display: grid; place-items: center; background: transparent; border: 0; color: var(--heading, #f8fafc);
    }
    .acct-bell:hover { background: var(--accent-dim, rgba(255,255,255,.08)); }
    .acct-bell .dot {
      position: absolute; top: -2px; right: -4px; min-width: 18px; height: 18px; padding: 0 5px;
      border-radius: 999px; background: #ef4444; color: #fff; font-size: .68rem; font-weight: 800;
      display: grid; place-items: center; border: 2px solid var(--bg, #0f172a);
    }
    .acct.round .acct-bell { width: 42px; height: 42px; background: rgba(15, 23, 42, .78); border: 2px solid rgba(248, 250, 252, .35); color: #f8fafc; }
    .acct-notif {
      position: absolute; right: 0; top: calc(100% + 8px); z-index: 100; width: min(340px, calc(100vw - 24px));
      max-height: min(70vh, 520px); overflow-y: auto; padding: 6px; border-radius: 12px;
      background: var(--bg, #0f172a); color: var(--text, #cbd5e1);
      border: 1px solid var(--line-soft, rgba(255,255,255,.12));
      box-shadow: 0 18px 40px -16px rgba(0, 0, 0, .6);
      font-size: .88rem; line-height: 1.4; text-align: left;
    }
    .acct-notif[hidden] { display: none; }
    .acct-notif h3 { margin: 6px 8px 8px; font-size: 1rem; color: var(--heading, #f8fafc); }
    .acct-notif a.n-item {
      display: flex; gap: 10px; align-items: center; padding: 8px; border-radius: 10px;
      color: inherit; text-decoration: none;
    }
    .acct-notif a.n-item:hover { background: var(--accent-dim, rgba(255,255,255,.08)); }
    .acct-notif a.n-item.unread { background: rgba(239, 68, 68, .08); }
    .acct-notif .n-pic {
      flex: none; width: 64px; height: 36px; border-radius: 6px; overflow: hidden;
      display: grid; place-items: center; font-weight: 800; color: rgba(15,23,42,.7); background: var(--tone, #94a3b8);
    }
    .acct-notif .n-pic img { width: 100%; height: 100%; object-fit: cover; }
    .acct-notif .n-text { min-width: 0; }
    .acct-notif .n-text b { color: var(--heading, #f8fafc); }
    .acct-notif .n-text span { display: block; font-size: .76rem; color: var(--muted, #94a3b8); margin-top: 2px; }
    .acct-notif .n-empty { padding: 18px 10px; color: var(--muted, #94a3b8); text-align: center; }
    .acct-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      height: 36px; padding: 0 14px; border-radius: 999px; cursor: pointer;
      font: inherit; font-size: .88rem; font-weight: 600;
      color: var(--heading, #f8fafc);
      background: transparent; border: 1px solid var(--line, rgba(248,250,252,.35));
      transition: border-color .15s ease, color .15s ease;
    }
    .acct-btn:hover { border-color: var(--accent, #d9f99d); color: var(--accent, #d9f99d); }
    .acct-avatar {
      width: 36px; height: 36px; padding: 0; border-radius: 50%; overflow: hidden; cursor: pointer;
      border: 2px solid var(--accent, #d9f99d); background: var(--bg-soft, #1e293b);
      display: grid; place-items: center; font-weight: 800; color: var(--heading, #f8fafc);
    }
    .acct-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .acct.round .acct-btn {
      height: 42px; background: rgba(15, 23, 42, .78); border: 2px solid rgba(248, 250, 252, .35); color: #f8fafc;
    }
    .acct.round .acct-avatar { width: 42px; height: 42px; }
    .acct.pending { visibility: hidden; }
    .acct-menu {
      position: absolute; right: 0; top: calc(100% + 8px); z-index: 100; min-width: 210px;
      padding: 6px; border-radius: 12px;
      background: var(--bg, #0f172a); color: var(--text, #cbd5e1);
      border: 1px solid var(--line-soft, rgba(255,255,255,.12));
      box-shadow: 0 18px 40px -16px rgba(0, 0, 0, .6);
      font-size: .9rem; line-height: 1.4; text-align: left;
    }
    .acct-menu[hidden] { display: none; }
    .acct-who { padding: 8px 10px 10px; border-bottom: 1px solid var(--line-soft, rgba(255,255,255,.12)); margin-bottom: 4px; }
    .acct-who b { display: block; color: var(--heading, #f8fafc); }
    .acct-who span { font-size: .8rem; color: var(--muted, #94a3b8); word-break: break-all; }
    .acct-menu a, .acct-menu button {
      display: block; width: 100%; padding: 9px 10px; border: 0; border-radius: 8px;
      background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; text-decoration: none;
    }
    .acct-menu a:hover, .acct-menu button:hover { background: var(--accent-dim, rgba(255,255,255,.08)); color: var(--heading, #f8fafc); }
    .acct-err { padding: 6px 10px; font-size: .8rem; color: #f87171; }
  `;
  document.head.appendChild(css);

  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  slot.classList.add("acct", "pending");
  if (round) slot.classList.add("round");

  /* ---------- 플랫폼 불러오기 ---------- */

  let platform = null;
  function loadPlatform() {
    if (platform) return platform;
    platform = window.MobsPlatform
      ? Promise.resolve(window.MobsPlatform)
      : new Promise((resolve, reject) => {
          window.addEventListener("mobs-platform-ready", () => resolve(window.MobsPlatform), { once: true });
          // 페이지에 platform.js가 없으면(메인) 직접 불러옵니다.
          if (!document.querySelector('script[src*="/js/platform.js"]')) {
            import(PLATFORM_URL).catch(reject);
          }
        });
    return platform;
  }

  /* ---------- 그리기 ---------- */

  let P = null;

  function render(u) {
    const member = P && P.isMember(u);
    if (!member) {
      slot.innerHTML = '<button class="acct-btn" type="button" data-acct="login">로그인</button>';
      return;
    }
    const name = u.displayName || u.email || "내 계정";
    const face = u.photoURL
      ? '<img src="' + esc(u.photoURL) + '" alt="" referrerpolicy="no-referrer">'
      : esc(name.charAt(0));
    slot.innerHTML =
      '<button class="acct-bell" type="button" data-acct="notif" aria-haspopup="true" aria-expanded="false" aria-label="알림">' +
        '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>' +
      "</button>" +
      '<div class="acct-notif" role="dialog" aria-label="알림" hidden><h3>알림</h3><div class="n-list"><p class="n-empty">불러오는 중…</p></div></div>' +
      '<button class="acct-avatar" type="button" data-acct="menu" aria-haspopup="true" aria-expanded="false" aria-label="내 계정">' + face + "</button>" +
      '<div class="acct-menu" role="menu" hidden>' +
        '<div class="acct-who"><b>' + esc(name) + "</b><span>" + esc(u.email || "") + "</span></div>" +
        '<a role="menuitem" href="/me/">내 페이지</a>' +
        '<a role="menuitem" href="/upload/#mineBox">내가 올린 게임</a>' +
        '<a role="menuitem" href="/upload/">게임 올리기</a>' +
        '<button role="menuitem" type="button" data-acct="logout">로그아웃</button>' +
      "</div>";
    refreshNotif();
  }

  /* ---------- 알림 ---------- */

  let notif = { items: [], unread: 0 };
  let lastFetch = 0;

  function ago(ms) {
    const s = (Date.now() - ms) / 1000;
    if (s < 60) return "방금";
    if (s < 3600) return Math.floor(s / 60) + "분 전";
    if (s < 86400) return Math.floor(s / 3600) + "시간 전";
    if (s < 86400 * 30) return Math.floor(s / 86400) + "일 전";
    return new Date(ms).toLocaleDateString("ko-KR");
  }
  function toneOf(id) {
    let h = 0;
    for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return "hsl(" + (h % 360) + " 70% 72%)";
  }

  function paintBadge() {
    const bell = slot.querySelector(".acct-bell");
    if (!bell) return;
    const old = bell.querySelector(".dot");
    if (old) old.remove();
    if (notif.unread > 0) {
      bell.insertAdjacentHTML("beforeend", '<span class="dot">' + (notif.unread > 9 ? "9+" : notif.unread) + "</span>");
      bell.setAttribute("aria-label", "알림 " + notif.unread + "개");
    } else {
      bell.setAttribute("aria-label", "알림");
    }
  }

  function paintList() {
    const list = slot.querySelector(".acct-notif .n-list");
    if (!list) return;
    list.innerHTML = notif.items.length
      ? notif.items.map(g =>
          '<a class="n-item' + (g.unread ? " unread" : "") + '" href="/feed/?play=1#' + encodeURIComponent(g.id) + '">' +
            '<div class="n-pic" style="--tone:' + toneOf(g.id) + '">' +
              (g.thumb ? '<img src="' + esc(g.thumb) + '" alt="" loading="lazy">' : esc(g.title.charAt(0))) + "</div>" +
            '<div class="n-text"><b>@' + esc(g.ownerName || "이름 없음") + "</b>님이 새 게임을 올렸어요: " + esc(g.title) +
              "<span>" + ago(g.createdAt) + "</span></div></a>").join("")
      : '<p class="n-empty">구독한 사람이 새 게임을 올리면 여기에 알려 드려요.</p>';
  }

  async function refreshNotif() {
    if (!P || !P.isMember()) return;
    lastFetch = Date.now();
    try {
      notif = await P.notifications();
    } catch (e) {
      console.warn("알림을 불러오지 못했어요.", e);
      return;
    }
    paintBadge();
    paintList();
  }

  function toggleNotif(open) {
    const panel = slot.querySelector(".acct-notif");
    const btn = slot.querySelector(".acct-bell");
    if (!panel) return;
    const show = open == null ? panel.hidden : open;
    panel.hidden = !show;
    btn.setAttribute("aria-expanded", show);
    if (show) {
      toggleMenu(false);
      paintList();
      // 열면 읽은 것으로 — 이번에 연 목록에서는 새 알림 강조를 그대로 둡니다.
      if (notif.unread > 0) {
        notif.unread = 0;
        paintBadge();
        P.markNotificationsSeen().catch(() => {});
      }
    }
  }

  // 다른 탭에 있다 돌아오면 다시 확인 (1분에 한 번까지)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && Date.now() - lastFetch > 60000) refreshNotif();
  });

  function toggleMenu(open) {
    const menu = slot.querySelector(".acct-menu");
    const btn = slot.querySelector(".acct-avatar");
    if (!menu) return;
    const show = open == null ? menu.hidden : open;
    menu.hidden = !show;
    btn.setAttribute("aria-expanded", show);
  }

  function afterChange() {
    if (slot.hasAttribute("data-reload")) location.reload();
  }

  slot.addEventListener("click", async e => {
    const el = e.target.closest("[data-acct]");
    if (!el) return;
    const act = el.dataset.acct;

    if (act === "menu") { toggleNotif(false); toggleMenu(); return; }
    if (act === "notif") { toggleNotif(); return; }

    if (act === "logout") {
      toggleMenu(false);
      await P.signOut();
      afterChange();
      return;
    }

    if (act === "login") {
      el.disabled = true;
      try {
        const p = P || await loadPlatform();
        await p.signInGoogle();
        afterChange();
      } catch (err) {
        if (err && err.code === "auth/popup-blocked") {
          alert("로그인 창이 막혔어요. 브라우저에서 이 사이트의 팝업을 허용해 주세요.");
        } else if (!err || (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request")) {
          alert("로그인하지 못했어요. 잠시 후 다시 시도해 주세요.");
          console.error(err);
        }
      } finally {
        el.disabled = false;
      }
    }
  });

  document.addEventListener("click", e => {
    if (!slot.contains(e.target)) { toggleMenu(false); toggleNotif(false); }
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { toggleMenu(false); toggleNotif(false); }
  });

  /* ---------- 시작: 첫 화면을 그린 뒤 ---------- */

  function start() {
    loadPlatform().then(async p => {
      P = p;
      await p.authReady();
      p.onUser(render);
      slot.classList.remove("pending");
    }).catch(err => {
      console.warn("로그인 기능을 불러오지 못했어요.", err);
      slot.remove();
    });
  }

  if (document.readyState === "complete") setTimeout(start, 0);
  else window.addEventListener("load", () => setTimeout(start, 0), { once: true });
})();
