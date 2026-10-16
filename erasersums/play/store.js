/* 지우개 셈 — 저장·날짜·설정 스위치 (홈과 판이 같이 쓴다) */
(function () {
  'use strict';
  const KEY = 'jiugae-sem-v2';
  const OLD_KEY = 'jiugae-sem-v1';

  function fresh() {
    return {
      level: 1, hints: 3,
      // 자동 지우기는 처음엔 끈다 — 남길 숫자만 고르면 줄이 저절로 지워져, 처음 하는 사람이 '지우기'를 안 배우고
      // 지나간다. 켜고 하던 사람은 저장된 값이 그대로 남는다(load 의 Object.assign)
      sound: true, vibe: true, autoErase: false,
      showLeft: true,        // 남은 합 보기 — 줄 합에서 동그라미 친 만큼 빼서 보여 준다(game.js paintLeft)
      lang: 'auto',          // 'auto' 면 기기 언어 (i18n.js)
      theme: 'light',        // 화면 'light' | 'dark' — 설정 탭. 폰이 어두운 모드여도 처음은 밝게(index.html 머리에서 붙인다)
      tutorialDone: false,   // 첫 판 안내(tutorial.js)를 끝냈나
      // 모드마다 하던 판 하나씩: level · daily · free · relaxed
      boards: {},
      // sizes[n] = { won, perfect } — 크기마다 이긴 판(별)과 실수 없이 이긴 판
      stats: { solved: 0, perfect: 0, best: {}, sizes: {} },
      daily: [], // 끝낸 날 'YYYY-MM-DD'
      journey: { stars: {} }, // 여정: 깬 단계마다 받은 별 (journey.js)
      pass: null, // 월간 패스 { m: 'YYYY-MM', s: 별, c: [받은 칸] } (pass.js)
    };
  }

  function load() {
    const d = fresh();
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      if (raw) {
        Object.assign(d, raw);
        d.boards = raw.boards || {};
        d.stats = Object.assign(fresh().stats, raw.stats);
        d.daily = Array.isArray(raw.daily) ? raw.daily : [];
        d.journey = raw.journey && typeof raw.journey.stars === 'object' ? raw.journey : { stars: {} };
        return d;
      }
      const v1 = JSON.parse(localStorage.getItem(OLD_KEY)); // 첫 시제품에서 옮겨 오기
      if (v1) {
        d.level = v1.level > 0 ? v1.level : 1;
        if (typeof v1.hints === 'number') d.hints = v1.hints;
        d.sound = v1.sound !== false;
        d.vibe = v1.vibe !== false;
        d.autoErase = v1.autoErase !== false;
        if (v1.board) d.boards.level = Object.assign({ mode: 'level' }, v1.board);
      }
    } catch (e) { /* 막혀 있으면 새로 시작 */ }
    return d;
  }

  const data = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* 저장 못 해도 판은 돈다 */ }
  }

  // ── 날짜 ──
  const pad = (x) => String(x).padStart(2, '0');
  function dateKey(dt) {
    dt = dt || new Date();
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  }
  function parseKey(k) {
    const [y, m, d] = k.split('-').map(Number);
    return { y, m, d, date: new Date(y, m - 1, d) };
  }
  function addDays(k, n) {
    const { date } = parseKey(k);
    date.setDate(date.getDate() + n);
    return dateKey(date);
  }
  // 요일마다 크기: 월요일이 제일 작고 주말이 제일 크다
  const DAILY_SIZE = [8, 5, 6, 6, 7, 7, 8]; // 일 월 화 수 목 금 토
  function dailySize(k) { return DAILY_SIZE[parseKey(k).date.getDay()]; }
  function dailySeed(k) { const { y, m, d } = parseKey(k); return y * 10000 + m * 100 + d; }
  function dailyDone(k) { return data.daily.includes(k); }
  // 오늘 아직 안 풀었으면 어제까지 이어진 날 수
  function streak() {
    let k = dateKey();
    if (!dailyDone(k)) k = addDays(k, -1);
    let n = 0;
    while (dailyDone(k)) { n++; k = addDays(k, -1); }
    return n;
  }

  // ── 크기별 별·Lv (스도쿠와 같은 셈: 이긴 판 하나 = 별 하나, 20개마다 Lv+1) ──
  const STARS_PER_LEVEL = 20;
  const SIZES = [5, 6, 7, 8, 9];
  const sizeStat = (n) => data.stats.sizes[n] || { won: 0, perfect: 0 };
  const levelOf = (won) => Math.floor(won / STARS_PER_LEVEL) + 1;
  const starsOf = (won) => won % STARS_PER_LEVEL;
  function noteWin(n, mistakes) {
    const s = (data.stats.sizes[n] = sizeStat(n));
    s.won++;
    if (mistakes === 0) s.perfect++;
  }
  // 권하는 크기: 이긴 적 있는 가장 큰 크기. 거기서 실수 없이 두 판이면 한 칸 위. 처음이면 5×5.
  function recommendSize() {
    let top = 0;
    for (const n of SIZES) if (sizeStat(n).won > 0) top = n;
    if (!top) return 5;
    return sizeStat(top).perfect >= 2 ? Math.min(9, top + 1) : top;
  }
  // 가장 많이 이긴 크기 (Lv 칩을 진하게)
  function favSize() {
    return SIZES.reduce((a, b) => (sizeStat(b).won > sizeStat(a).won ? b : a), SIZES[0]);
  }

  // ── 도전 코드: E + 크기 + '-' + 씨앗(36진수). 같은 코드면 누구나 같은 판 ──
  const codeOf = (n, seed) => `E${n}-${(seed >>> 0).toString(36).toUpperCase()}`;
  function parseCode(text) {
    const m = String(text).toUpperCase().replace(/\s+/g, '').match(/^E([5-9])-?([0-9A-Z]{1,7})$/);
    if (!m) return null;
    const seed = parseInt(m[2], 36);
    if (!(seed >= 0 && seed <= 0xffffffff)) return null;
    return { n: +m[1], seed };
  }

  function fmtTime(ms) {
    const s = Math.round(ms / 1000);
    return `${Math.floor(s / 60)}:${pad(s % 60)}`;
  }

  // ── 설정 스위치: 홈 설정 탭과 판 안의 설정 창이 같은 것을 그린다 ──
  const TOGGLES = [
    { key: 'sound', label: 'set.sound' },
    { key: 'vibe', label: 'set.vibe' },
    { key: 'autoErase', label: 'set.auto', desc: 'set.auto.desc' },
    { key: 'showLeft', label: 'set.left', desc: 'set.left.desc' },
  ];
  const listeners = [];
  function mountToggles(el) {
    const say = (k) => (window.T ? window.T(k) : k);
    el.innerHTML = TOGGLES.map((t) =>
      `<button class="row" type="button" data-toggle="${t.key}" aria-pressed="${data[t.key]}">` +
      (t.desc ? `<span class="label">${say(t.label)}<span class="desc">${say(t.desc)}</span></span>` : `<span>${say(t.label)}</span>`) +
      '<span class="sw"></span></button>').join('');
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-toggle]');
      if (!b) return;
      const key = b.dataset.toggle;
      data[key] = !data[key];
      save();
      paintToggles();
      listeners.forEach((fn) => fn(key, data[key]));
    });
  }
  function paintToggles() {
    document.querySelectorAll('[data-toggle]').forEach((b) => b.setAttribute('aria-pressed', String(data[b.dataset.toggle])));
  }
  function onToggle(fn) { listeners.push(fn); }

  window.Store = {
    d: data, save,
    dateKey, parseKey, addDays, dailySize, dailySeed, dailyDone, streak, fmtTime,
    STARS_PER_LEVEL, SIZES, sizeStat, levelOf, starsOf, noteWin, recommendSize, favSize, codeOf, parseCode,
    mountToggles, paintToggles, onToggle,
  };
})();
