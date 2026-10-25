/* ===================================================
   계정 버튼 (메인·피드 오른쪽 위)
   ---------------------------------------------------
   <div data-account></div> 자리에 그립니다.
     - 로그인 전: "로그인" 버튼 → 구글 로그인 팝업
     - 로그인 후: 프로필 사진 → 메뉴 (내 페이지 / 내가 올린 게임 / 게임 올리기 / 로그아웃)
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

  const PLATFORM_URL = "/js/platform.js?v=5";
  const round = slot.dataset.account === "round";

  /* ---------- 스타일 (두 페이지 공용, 각 페이지 색을 따라감) ---------- */

  const css = document.createElement("style");
  css.textContent = `
    .acct { position: relative; flex: none; }
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
      '<button class="acct-avatar" type="button" data-acct="menu" aria-haspopup="true" aria-expanded="false" aria-label="내 계정">' + face + "</button>" +
      '<div class="acct-menu" role="menu" hidden>' +
        '<div class="acct-who"><b>' + esc(name) + "</b><span>" + esc(u.email || "") + "</span></div>" +
        '<a role="menuitem" href="/me/">내 페이지</a>' +
        '<a role="menuitem" href="/upload/#mineBox">내가 올린 게임</a>' +
        '<a role="menuitem" href="/upload/">게임 올리기</a>' +
        '<button role="menuitem" type="button" data-acct="logout">로그아웃</button>' +
      "</div>";
  }

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

    if (act === "menu") { toggleMenu(); return; }

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

  document.addEventListener("click", e => { if (!slot.contains(e.target)) toggleMenu(false); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") toggleMenu(false); });

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
