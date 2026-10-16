/* 지우개 셈 — 구글 Play 게임즈 (안드로이드에서만). 네이티브 통로는 android/.../PlayGamesPlugin.java.
 * 클래식 스도쿠의 src/games/playGames.ts 를 옮기고 업적을 더했다.
 *
 * 로그인은 "게스트 → 구글 연동". 앱을 켜면 구글이 자동 로그인을 시도하고, 기기에 Play 게임즈 계정이
 * 있으면 따로 누를 것 없이 연결된다. 안 되면 그냥 하고, 원하는 사람만 설정 탭에서 "연결하기" 를 누른다.
 *
 * 연결되면
 *   순위표   여정에서 모은 별 합계(Journey.totalStars)
 *   업적     ACH 의 조건을 저장 데이터로 판단한다. 한 번 연 것은 기억해 두고 다시 부르지 않는다.
 *   저장     진행(단계·별·기록·데일리)을 "저장된 게임" 에 올려 두고, 연결될 때 받아 합친다(merge).
 *            폰을 바꿔도 이어서 할 수 있다. 설정(소리·언어)과 하던 판은 기기마다 따로 둔다.
 *
 * Play Console 설정(res/values/games.xml)이 비어 있으면 configured 가 false 이고 관련 화면이 숨는다.
 * 무엇이 실패해도 게임은 그대로 돈다 — 전부 조용히 삼킨다.
 */
(function () {
  'use strict';
  const cap = window.Capacitor;
  const native = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const P = !native ? null
    : (cap.registerPlugin ? cap.registerPlugin('PlayGames') : (cap.Plugins && cap.Plugins.PlayGames) || null);
  const St = window.Store;
  const d = St.d;

  // 업적 — 키는 games.xml 의 achievement_<키>, 이름·설명은 Play Console 에 네 언어로 적는다
  const cleared = (stage) => !!(d.journey && d.journey.stars && d.journey.stars[stage]);
  const ACH = {
    first_win: () => d.stats.solved >= 1,
    perfect: () => d.stats.perfect >= 1,
    size9: () => ((d.stats.sizes || {})[9] || {}).won >= 1,
    perfect9: () => ((d.stats.sizes || {})[9] || {}).perfect >= 1,
    chapter1: () => cleared(10),
    chapter3: () => cleared(30),
    daily7: () => St.streak() >= 7,
    solved100: () => d.stats.solved >= 100,
  };

  // 한 번 보낸 것 — 게임 저장(Store)과 따로 둔다. 클라우드로 옮기지 않는다(계정마다 구글이 기억한다).
  const SENT_KEY = 'jiugae-sem-games';
  let sent = { ach: [], score: 0 };
  try { sent = Object.assign(sent, JSON.parse(localStorage.getItem(SENT_KEY)) || {}); } catch (e) { /* 새로 */ }
  const keepSent = () => { try { localStorage.setItem(SENT_KEY, JSON.stringify(sent)); } catch (e) { /* 괜찮다 */ } };

  const state = { configured: false, leaderboard: false, achievements: false, authenticated: false, name: null };
  const watchers = [];
  const changed = () => watchers.forEach((fn) => { try { fn(state); } catch (e) { /* 화면 쪽 문제 */ } });

  function applyAuth(a) {
    const was = state.authenticated;
    state.authenticated = !!(a && a.authenticated);
    state.name = (a && a.name) || null;
    changed();
    if (state.authenticated && !was) onSignedIn();
  }

  // ── 클라우드 저장: 진행만 합친다. 더 많이 한 쪽이 이기게(최댓값·합집합) ──
  function pack() {
    return JSON.stringify({
      v: 1, level: d.level, hints: d.hints, tutorialDone: d.tutorialDone,
      stats: d.stats, daily: d.daily, journey: d.journey, pass: d.pass,
    });
  }
  function merge(r) {
    if (!r || r.v !== 1) return false;
    const before = pack();
    const max = (a, b) => Math.max(a || 0, b || 0);
    d.level = max(d.level, r.level);
    d.hints = max(d.hints, r.hints);
    d.tutorialDone = !!(d.tutorialDone || r.tutorialDone);
    const s = d.stats, rs = r.stats || {};
    s.solved = max(s.solved, rs.solved);
    s.perfect = max(s.perfect, rs.perfect);
    for (const [n, t] of Object.entries(rs.best || {})) if (!s.best[n] || t < s.best[n]) s.best[n] = t;
    for (const [n, z] of Object.entries(rs.sizes || {})) {
      const mine = s.sizes[n] || { won: 0, perfect: 0 };
      s.sizes[n] = { won: max(mine.won, z.won), perfect: max(mine.perfect, z.perfect) };
    }
    d.daily = [...new Set([...(d.daily || []), ...(r.daily || [])])].sort();
    const js = d.journey.stars, rj = (r.journey && r.journey.stars) || {};
    for (const [k, v] of Object.entries(rj)) js[k] = max(js[k], v);
    // 월간 패스: 같은 달이면 별은 큰 쪽, 받은 칸은 합집합. 다른 달이면 나중 달
    const rp = r.pass, mp = d.pass;
    if (rp && rp.m && (!mp || rp.m > mp.m)) d.pass = { m: rp.m, s: rp.s || 0, c: (rp.c || []).slice(), t: rp.t };
    else if (rp && mp && rp.m === mp.m) { mp.s = max(mp.s, rp.s); mp.c = [...new Set([...mp.c, ...(rp.c || [])])]; if (rp.t) mp.t = rp.t; }
    return pack() !== before;
  }

  let saveTimer = 0;
  function saveSoon() {
    if (!P || !state.authenticated) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      try {
        await P.saveGame({ name: 'progress', data: pack(), description: T('games.saveDesc', { n: window.Journey ? window.Journey.totalStars() : 0 }) });
      } catch (e) { /* 다음에 다시 */ }
    }, 3000);
  }

  async function onSignedIn() {
    // 먼저 받아 합치고, 합친 것을 다시 올린다 (새 폰이면 받기만, 옛 폰이면 올리기만 되는 셈)
    try {
      const got = await P.loadGame({ name: 'progress' });
      if (got && got.data && merge(JSON.parse(got.data))) {
        St.save();
        if (window.Home && window.Home.repaint) window.Home.repaint();
      }
    } catch (e) { /* 충돌·네트워크 — 이번엔 넘어간다 */ }
    sync();
  }

  // ── 판이 끝날 때마다(game.js) 그리고 연결될 때 ──
  async function sync() {
    if (!P || !state.authenticated) return;
    if (state.achievements) {
      for (const [key, met] of Object.entries(ACH)) {
        if (sent.ach.includes(key) || !met()) continue;
        try { await P.unlock({ key }); sent.ach.push(key); keepSent(); } catch (e) { /* 다음 판에 */ }
      }
    }
    const stars = window.Journey ? window.Journey.totalStars() : 0;
    if (state.leaderboard && stars > sent.score) {
      try { await P.submitScore({ score: stars }); sent.score = stars; keepSent(); } catch (e) { /* 다음 판에 */ }
    }
    saveSoon();
  }

  async function init() {
    if (!P) return;
    try {
      const s = await P.status();
      state.configured = !!s.configured;
      state.leaderboard = !!s.leaderboard;
      state.achievements = !!s.achievements;
      changed();
      if (!state.configured) return;
      applyAuth(await P.isAuthenticated());
    } catch (e) { /* 옛 빌드거나 구글 서비스가 없는 기기 — 게스트로 계속 */ }
  }

  async function signIn() {
    if (!P || !state.configured) return false;
    try { applyAuth(await P.signIn()); } catch (e) { /* 창을 닫았거나 실패 */ }
    return state.authenticated;
  }
  async function show(what) {
    if (!P || !state.configured) return;
    if (!state.authenticated && !(await signIn())) return;
    try { await (what === 'ach' ? P.showAchievements() : P.showLeaderboard()); } catch (e) { /* 조용히 */ }
  }

  // 앱을 내릴 때 한 번 더 올려 둔다
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.authenticated && saveTimer) {
      clearTimeout(saveTimer); saveTimer = 0;
      P.saveGame({ name: 'progress', data: pack(), description: '' }).catch(() => {});
    }
  });

  window.Games = {
    state, sync, signIn,
    leaderboard: () => show('lb'),
    achievements: () => show('ach'),
    watch: (fn) => { watchers.push(fn); fn(state); },
    _merge: merge, _pack: pack,   // 시험용
  };
  // ── 설정 탭의 Play 게임즈 카드 ──
  const $ = (id) => document.getElementById(id);
  function paint() {
    const card = $('gamesCard');
    if (!card) return;
    card.hidden = !state.configured;
    if (!state.configured) return;
    $('gamesWho').textContent = state.authenticated
      ? (state.name ? T('games.who', { n: state.name }) : T('games.on'))
      : T('games.guest');
    $('gamesConnect').hidden = state.authenticated;
    $('gamesBoard').hidden = !state.leaderboard;
    $('gamesAch').hidden = !state.achievements;
  }
  // 토스 미니앱에서는 이 카드를 toss.js 가 토스 게임센터로 쓴다
  if ($('gamesCard') && !(window.Toss && window.Toss.inToss)) {
    $('gamesConnect').addEventListener('click', () => { signIn(); });
    $('gamesBoard').addEventListener('click', () => show('lb'));
    $('gamesAch').addEventListener('click', () => show('ach'));
    watchers.push(paint);
    document.addEventListener('langchange', paint);
  }

  init();
})();
