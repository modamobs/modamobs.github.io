/* ===================================================
   게임 포털 렌더링
   ---------------------------------------------------
   js/games.js의 GAMES 배열을 읽어 카드 그리드를 그리고,
   장르 필터와 검색을 처리합니다. 데이터만 고치면 되고
   이 파일은 건드릴 일이 거의 없습니다.
   =================================================== */

(function () {
  "use strict";

  const grid     = document.getElementById("gameGrid");
  const filters  = document.getElementById("filters");
  const searchEl = document.getElementById("search");
  const emptyMsg = document.getElementById("emptyMsg");

  if (!grid || typeof GAMES === "undefined") return;

  /* 섹션 정의: 순서대로 그려집니다. */
  const SECTIONS = [
    { key: "web",  label: "바로 플레이",   note: "설치 없이 브라우저에서" },
    { key: "app",  label: "앱으로 즐기기", note: "Google Play 출시작" },
    { key: "soon", label: "곧 만나요",     note: "준비 중" }
  ];

  let activeGenre = "전체";
  let query = "";

  /* 실제로 어느 섹션에 들어갈지.
     웹 게임이라도 빌드가 아직 안 올라갔으면(playable:false) "곧 만나요"로 갑니다. */
  function sectionOf(game) {
    if (game.status === "web") return game.playable ? "web" : "soon";
    return game.status === "app" ? "app" : "soon";
  }

  /* ── 장르 필터 버튼: 데이터에 있는 장르로 자동 생성 ── */
  function buildFilters() {
    const genres = ["전체"];
    GAMES.forEach(g => (g.genres || []).forEach(t => {
      if (!genres.includes(t)) genres.push(t);
    }));

    filters.innerHTML = "";
    genres.forEach(name => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip" + (name === activeGenre ? " is-active" : "");
      btn.textContent = name;
      btn.setAttribute("aria-pressed", String(name === activeGenre));
      btn.addEventListener("click", () => {
        activeGenre = name;
        buildFilters();
        render();
      });
      filters.appendChild(btn);
    });
  }

  /* ── 검색·필터 통과 여부 ── */
  function matches(game) {
    if (activeGenre !== "전체" && !(game.genres || []).includes(activeGenre)) return false;
    if (!query) return true;
    const hay = [game.title, game.desc, (game.genres || []).join(" ")]
      .join(" ")
      .toLowerCase();
    return hay.includes(query);
  }

  /* ── 카드 한 장 ── */
  function cardOf(game) {
    const li = document.createElement("li");
    li.className = "card";
    if (game.accent) li.style.setProperty("--tint", game.accent);

    /* 플레이 가능한 게임은 카드 전체가 플레이로, 아니면 소개 페이지로 */
    const canPlay = game.status === "web" && game.playable && game.play;
    const href = canPlay
      ? "/play/?g=" + encodeURIComponent(game.slug)
      : (game.about || game.store || "#");

    const badge =
      game.status === "web"  ? (game.playable ? ["badge-web", "바로 플레이"] : ["badge-soon", "준비 중"]) :
      game.status === "app"  ? ["badge-app", "앱"] :
                               ["badge-soon", "준비 중"];

    const thumb = game.thumb
      ? `<img src="${game.thumb}" alt="" loading="lazy" decoding="async">`
      : `<div class="thumb-initial" aria-hidden="true">${(game.title || "?").trim().charAt(0)}</div>`;

    const genres = (game.genres || [])
      .map(t => `<li>${t}</li>`)
      .join("");

    /* 카드 본문 링크: 소개 페이지 / 스토어 (카드 전체 링크와 겹치지 않게 z-index) */
    const links = [];
    if (game.about) links.push(`<a href="${game.about}">소개</a>`);
    if (game.store) links.push(`<a href="${game.store}" target="_blank" rel="noopener noreferrer">Google Play</a>`);

    li.innerHTML = `
      <div class="card-thumb">
        ${thumb}
        <span class="badge ${badge[0]}">${badge[1]}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title"><a href="${href}">${game.title}</a></h3>
        <p class="card-desc">${game.desc || ""}</p>
        <ul class="card-genres">${genres}</ul>
        ${links.length ? `<div class="card-links">${links.join("")}</div>` : ""}
      </div>`;
    return li;
  }

  /* ── 전체 렌더 ── */
  function render() {
    grid.innerHTML = "";
    let shown = 0;

    SECTIONS.forEach(section => {
      const list = GAMES.filter(g => sectionOf(g) === section.key && matches(g));
      if (!list.length) return;
      shown += list.length;

      const head = document.createElement("div");
      head.className = "section-head";
      head.innerHTML = `<h2>${section.label}</h2><span class="count">${section.note} · ${list.length}</span>`;

      const ul = document.createElement("ul");
      ul.className = "grid";
      list.forEach(g => ul.appendChild(cardOf(g)));

      const wrap = document.createElement("section");
      wrap.className = "section";
      wrap.appendChild(head);
      wrap.appendChild(ul);
      grid.appendChild(wrap);
    });

    emptyMsg.hidden = shown > 0;
  }

  /* ── 검색 입력 ── */
  if (searchEl) {
    searchEl.addEventListener("input", () => {
      query = searchEl.value.trim().toLowerCase();
      render();
    });
  }

  /* ── 테마 전환: 포트폴리오 페이지와 같은 키를 씁니다 ── */
  const root = document.documentElement;
  const THEME_KEY = "theme";                       /* main.js와 같은 키 */
  root.setAttribute("data-theme", localStorage.getItem(THEME_KEY) || "dark");

  const themeBtn = document.getElementById("themeToggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem(THEME_KEY, next);
    });
  }

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  buildFilters();
  render();
})();
