/* 지우개 셈 — 1:1 대결 (토스 미니앱에서만. 클래식 스도쿠 src/battle/* 를 옮김)
 *
 * 실시간 매칭이 아니다 — 같은 판을 먼저 푼 **실제 사람의 기록**을 판 시계에 맞춰 되감는다(고스트).
 * 사람이 적어(토스 DAU 수백) 같은 순간에 대결을 누르는 사람이 거의 없어서다. 봇은 없다 — 기록이 없으면 못 연다.
 *
 *   판     6×6 하나(티켓 1장, 색깔 묶음 판). 2026-10-16 마스터(8×8)는 뺐다 — 길고(끝까지 이긴 기록이 13개 중 2개)
 *          사람이 적을 때 두 갈래로 나누면 상대가 더 모자란다
 *   기록   새 게임·데일리·대결에서 6×6 판을 힌트 없이 처음부터 끝까지 한 것만 올린다(이기거나 하트 3개를 다 썼거나).
 *          칸이 정해진 시각(0.1초)들 ok, 틀린 시각들 bad, 끝난 시각 end. 판은 씨앗(seed)으로 똑같이 다시 만든다
 *   상대   그 등급 기록에서 무작위로 16개쯤 받아, 나·최근 만난 5명을 빼고, 내 승률로 고른다
 *          (처음 세 판이나 승률 40% 아래 = 가장 느린 사람, 60% 위 = 가장 빠른 사람, 그 사이 = 가운데)
 *   승패   내가 먼저 다 지우면 승. 상대 기록이 먼저 끝나면 패. 하트 3개를 다 쓰면 패. 상대가 하트를 다 썼으면 끝까지 풀기만 하면 승
 *   대결판 힌트·이어하기 없음. 나가면 진 것으로 친다
 *   티켓   5장까지 30분마다 1장씩 찬다. 보상형 광고를 보면 +3장(5장을 넘겨도 된다). 상대를 찾은 뒤에만 깎는다
 *   시즌   달력 한 달. 브론즈 0 · 실버 100 · 골드 300 · 다이아 600. 승 +10 패 −4.
 *          등급 바닥 아래로는 안 내려간다. 새 달은 지난달 등급 한 단계 아래 바닥에서 시작. 보상은 없다(엠블럼·배지뿐)
 *   잠금   퍼즐 3판을 풀어야 열린다(이미 대결을 해 본 사람은 늘 열림)
 *
 * 서버는 fire.js(Firestore REST). 설정이 비어 있으면 대결 탭이 안 보인다. 개발 중 브라우저에서는 ?battle=1.
 */
(function () {
  'use strict';
  const St = window.Store, d = St.d;
  const $ = (id) => document.getElementById(id);
  const sfx = (n, at, i) => { if (window.Sfx) window.Sfx(n, at, i); };
  const Toss = window.Toss && window.Toss.inToss ? window.Toss : null;
  const Fire = window.Fire;
  const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // 2026-10-07 부터 기록만 모으다가(OPEN = false 면 대결 탭·대결 업적·수상의 대결 탭을 숨긴다)
  // 2026-10-16 6×6 기록 10개·6명(스도쿠는 등급마다 5명쯤에서 열었다)이 되어 연다. 얼마나 쌓였는지: node scripts/ghost-count.mjs
  const OPEN = true;
  const DEV = new URLSearchParams(location.search).get('battle') === '1';
  const collect = !!(Toss && Fire && Fire.ready);
  const open = (collect && OPEN) || DEV;

  const TIERS = {
    n6: { n: 6, cost: 1, win: 10, loss: -4 },
  };
  const tierOfSize = (n) => (n === 6 ? 'n6' : null);
  const SEASON = [['bronze', 0], ['silver', 100], ['gold', 300], ['diamond', 600]];
  const TICKET_MAX = 5, TICKET_MS = 30 * 60000, TICKETS_PER_AD = 3;
  const UNLOCK = 3;
  const MIN_DS_PER_CELL = 3;   // 칸당 평균 0.3초보다 빠른 기록은 버린다(만든 기록일 가능성)
  const SEARCH_MS = 8000;
  const RECENT = 5;
  // 서버 시험 때 올린 기록의 사람 — 규칙상 지울 수 없으니 상대로 고르지 않는다 (scripts/ghost-count.mjs 도 같이)
  const SKIP = ['49uXi7HaWXUAiObHx8Rw4T9RSjf2'];

  // ── 저장 ──
  const KEY = 'jiugae-battle';
  const blank = () => ({ won: 0, lost: 0, tiers: { n6: { won: 0, lost: 0 }, n8: { won: 0, lost: 0 } }, months: {}, recent: [], seen: false, tickets: { n: TICKET_MAX, at: Date.now() } });
  let b = blank();
  try { b = Object.assign(b, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { /* 새로 */ }
  const keep = () => { try { localStorage.setItem(KEY, JSON.stringify(b)); } catch (e) { /* 다음에 */ } };

  // ── 티켓 ──
  function refill() {
    const t = b.tickets;
    if (t.n >= TICKET_MAX) { t.at = Date.now(); return; }
    const gained = Math.floor((Date.now() - t.at) / TICKET_MS);
    if (gained > 0) {
      t.n = Math.min(TICKET_MAX, t.n + gained);
      t.at = t.n >= TICKET_MAX ? Date.now() : t.at + gained * TICKET_MS;
      keep();
    }
  }
  const tickets = () => { refill(); return b.tickets.n; };
  const nextTicketMin = () => Math.max(1, Math.ceil((b.tickets.at + TICKET_MS - Date.now()) / 60000));
  function spend(n) { refill(); if (b.tickets.n === TICKET_MAX) b.tickets.at = Date.now(); b.tickets.n -= n; keep(); }

  // ── 시즌 ──
  const monthKey = (dt) => { dt = dt || new Date(); return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`; };
  const prevMonth = (m) => { const [y, mo] = m.split('-').map(Number); return monthKey(new Date(y, mo - 2, 1)); };
  const tierIdx = (p) => SEASON.reduce((a, [, floor], i) => (p >= floor ? i : a), 0);
  function seasonPoints(m) {
    const mo = b.months[m];
    if (mo && typeof mo.points === 'number') return mo.points;
    const last = b.months[prevMonth(m)];
    if (!last || typeof last.points !== 'number') return 0;
    return SEASON[Math.max(0, tierIdx(last.points) - 1)][1];
  }
  function applyResult(points, delta) {
    const floor = SEASON[tierIdx(points)][1];
    return Math.max(floor, points + delta);
  }
  function season() {
    const m = monthKey(), p = seasonPoints(m), i = tierIdx(p);
    const next = SEASON[i + 1];
    const now = new Date(), end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return {
      month: +m.slice(5), points: p, tier: SEASON[i][0],
      next: next ? next[0] : null, toNext: next ? next[1] - p : 0,
      frac: next ? (p - SEASON[i][1]) / (next[1] - SEASON[i][1]) : 1,
      daysLeft: Math.ceil((end - now) / 86400000),
    };
  }

  // ── 전적 ──
  const record = () => ({ won: b.won, lost: b.lost });
  const rate = (w, l) => (w + l ? w / (w + l) : 0);
  function recordResult(won, tier) {
    const m = monthKey();
    const mo = (b.months[m] = b.months[m] || { won: 0, lost: 0 });
    const before = seasonPoints(m);
    const T_ = TIERS[tier];
    mo.points = applyResult(before, won ? T_.win : T_.loss);
    if (won) { b.won++; b.tiers[tier].won++; mo.won++; } else { b.lost++; b.tiers[tier].lost++; mo.lost++; }
    keep();
    return { before, after: mo.points, up: tierIdx(mo.points) > tierIdx(before) };
  }
  // 수상 화면의 달마다 배지: 그달 승수로 돌·초록·파랑·금
  function months() {
    return Object.entries(b.months).filter(([, v]) => v.won + v.lost > 0).sort((a, c) => (a[0] < c[0] ? 1 : -1))
      .map(([m, v]) => ({ y: +m.slice(0, 4), m: +m.slice(5), won: v.won, lost: v.lost, tier: SEASON[tierIdx(v.points || 0)][0], badge: badgeOf(v.won) }));
  }
  const badgeOf = (w) => (w >= 60 ? 'gold' : w >= 30 ? 'blue' : w >= 10 ? 'green' : 'stone');

  const unlocked = () => d.stats.solved >= UNLOCK || b.won + b.lost > 0;

  // ── 이름 ──
  // 상대에게 보이는 이름은 토스 게임센터 닉네임. 게임 프로필이 없는 사람은 닉네임을 못 받아 와서
  // 2026-10-16 까지 올라간 기록이 전부 「플레이어」였다(봇처럼 보였다). 그래서
  //   · 닉네임이 있을 때만 기억한다 — 없으면 다음에 다시 물어본다(순위표를 열어 프로필을 만들고 돌아올 수 있다)
  //   · 대결 탭 위에 내 이름 줄 — 없으면 「프로필 만들기」(순위표를 열면 토스가 만든다)
  //   · 상대를 고를 때 닉네임이 있는 기록을 먼저, 이름 없는 옛 기록은 「익명」으로 보인다
  //   · 2026-10-16 앱 안에서 닉네임을 정할 수 있다(b.nick) — 있으면 그것이 먼저, 없으면 토스 게임 닉네임
  let myName = null;
  async function nick() {
    if (b.nick) return b.nick;
    if (myName) return myName;
    let n = '';
    if (Toss && Toss.game && Toss.game.profile) n = await Toss.game.profile();
    n = (n || '').trim().slice(0, 24);
    if (n) myName = n;
    return n;
  }
  // 닉네임 검사: 2~10자, 글자·숫자·공백·_-.만. 「플레이어」 같은 기본 이름이나 욕설은 안 된다(남에게 보인다)
  const NICK_MIN = 2, NICK_MAX = 10;
  const BAD = ['시발', '씨발', 'ㅅㅂ', '병신', 'ㅂㅅ', '개새', '좆', '존나', '지랄', '꺼져', '섹스', '보지', '자지', '미친놈', '미친년',
    'fuck', 'shit', 'bitch', 'sex', 'admin', '관리자', '운영자', '토스'];
  function checkNick(raw) {
    const n = String(raw || '').replace(/\s+/g, ' ').trim();
    if (n.length < NICK_MIN || n.length > NICK_MAX) return { ok: false, why: 'battle.nickLen' };
    if (!/^[\p{L}\p{N} _.-]+$/u.test(n)) return { ok: false, why: 'battle.nickChars' };
    const low = n.toLowerCase().replace(/[\s_.-]/g, '');
    if (GENERIC.has(n) || BAD.some((w) => low.includes(w))) return { ok: false, why: 'battle.nickBad' };
    return { ok: true, n };
  }
  /** 닉네임 정하기 창. after 가 있으면 저장(또는 건너뛰기) 뒤에 부른다 */
  async function editNick(after) {
    const cur = (await nick()) || '';
    const G = window.Game;
    G.modal({
      title: T('battle.nickTitle'),
      body: `${T('battle.nickBody')}<br><input id="nickInput" class="code-input nick-input" maxlength="${NICK_MAX}" ` +
        `value="${esc(cur)}" placeholder="${esc(T('battle.nickPh'))}" spellcheck="false" autocomplete="off">` +
        `<span id="nickErr" class="nick-err" hidden></span>`,
      actions: [
        { label: T('battle.nickSave'), fn: () => {
          const r = checkNick($('nickInput').value);
          if (!r.ok) { $('nickErr').textContent = T(r.why, { a: NICK_MIN, b: NICK_MAX }); $('nickErr').hidden = false; return; }
          b.nick = r.n; keep();
          if (window.Track) window.Track('battle_nick_set', { len: r.n.length });
          G.hideModal(); G.toast(T('battle.nickSaved', { n: r.n }));
          render();
          if (after) after();
        } },
        { label: after ? T('battle.nickSkip') : T('home.close'), kind: 'ghost', fn: () => { G.hideModal(); if (after) after(); } },
      ],
    });
    setTimeout(() => { const i = $('nickInput'); if (i) { i.focus(); i.select(); } }, 50);
  }
  async function name() { return (await nick()) || T('battle.player'); }
  const GENERIC = new Set(['', '플레이어', 'Player', 'プレイヤー', '玩家', '시험']);
  const named = (g) => !GENERIC.has(String(g.name || '').trim());
  /** 화면에 보일 상대 이름 — 닉네임이 없던 옛 기록은 「익명」 */
  const shownName = (g) => (named(g) ? g.name : T('battle.anon'));

  // ── 고스트 ──
  /** 판 시계 ms 일 때 상대 기록이 어디까지 왔나 */
  function ghostAt(g, ms) {
    const t = ms / 100;
    let filled = 0, bad = 0;
    for (const x of g.ok) if (x <= t) filled++;
    for (const x of g.bad) if (x <= t) bad++;
    return { filled, bad, done: g.won && t >= g.end, out: !g.won && g.bad.length >= 3 && t >= g.bad[2] };
  }
  function plausible(g, n) {
    if (!g || !Array.isArray(g.ok) || !Array.isArray(g.bad) || g.n !== n) return false;
    const N = n * n;
    if (g.ok.length > N || g.bad.length > 3) return false;
    if (g.won ? g.ok.length !== N : g.bad.length !== 3) return false;
    for (let i = 1; i < g.ok.length; i++) if (g.ok[i] < g.ok[i - 1]) return false;
    if (g.ok.some((x) => x > g.end) || g.bad.some((x) => x > g.end)) return false;
    return g.won ? g.end >= N * MIN_DS_PER_CELL : true;
  }
  const speed = (g) => (g.won ? g.end : Infinity);

  async function findGhost(tier) {
    const n = TIERS[tier].n;
    const me = Fire && Fire.uid();
    const x = Math.random();
    let got = (await Fire.sample(`ghosts/${tier}`, 'runs', x, 16)) || [];
    if (got.length < 16) got = got.concat((await Fire.sample(`ghosts/${tier}`, 'runs', 0, 16 - got.length)) || []);
    const seen = new Set();
    let pool = got.filter((g) => g.by !== me && !SKIP.includes(g.by) && plausible(g, n) && !seen.has(g.by) && seen.add(g.by));
    const fresh = pool.filter((g) => !b.recent.includes(g.by));
    if (fresh.length) pool = fresh;
    const withName = pool.filter(named);   // 닉네임이 있는 사람을 먼저(「익명」보다 사람처럼 보인다)
    if (withName.length) pool = withName;
    if (!pool.length) return null;
    pool = pool.slice(0, 8).sort((a, c) => speed(c) - speed(a));   // 느린 사람부터
    const t = b.tiers[tier], played = t.won + t.lost, r = rate(t.won, t.lost);
    if (played < 3 || r < 0.4) return pool[0];
    if (r > 0.6) return pool[pool.length - 1];
    return pool[Math.floor(pool.length / 2)];
  }

  /** 판 하나를 기록으로 올린다(game.js 가 부른다). 조용히, 실패하면 버린다 */
  async function upload(run) {
    const tier = tierOfSize(run.n);
    if (!(collect || DEV) || !Fire || !Fire.ready || !tier) return;
    const ok = run.ok.slice(0, run.n * run.n);
    const bad = run.bad.slice(0, 3);
    const end = run.won ? run.end : bad[2];
    const g = { n: run.n, seed: run.seed >>> 0, ok, bad, end, won: run.won };
    if (!plausible(g, run.n)) return;
    const a = await Fire.signIn();
    if (!a) return;
    const id = `${a.uid}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    await Fire.create(`ghosts/${tier}/runs`, id, Object.assign(g, { by: a.uid, name: await name(), lv: d.level, r: { double: Math.random() * 0.999999 } }));
  }

  // ── 대결 시작·끝 ──
  let searching = 0;
  let nickAsked = false;
  async function start(tier) {
    const T_ = TIERS[tier];
    if (tickets() < T_.cost) { askTickets(); return; }
    // 닉네임이 없으면 한 번(켤 때마다) 정하라고 한다 — 상대에게 「플레이어」로 보이면 봇 같다
    if (!nickAsked && !(await nick())) {
      nickAsked = true;
      editNick(() => start(tier));
      return;
    }
    const token = ++searching;
    window.Game.modal({ title: T('battle.searching'), body: '', actions: [{ label: T('battle.cancel'), kind: 'ghost', fn: () => { searching++; window.Game.hideModal(); } }] });
    const timeout = new Promise((res) => setTimeout(() => res(null), SEARCH_MS));
    const ghost = Fire && Fire.ready ? await Promise.race([findGhost(tier), timeout]) : null;
    if (token !== searching) return;   // 취소했다
    window.Game.hideModal();
    if (!ghost) {
      window.Game.toast(T('battle.noMatch'));
      if (window.Track) window.Track('battle_no_match', { tier });
      return;
    }
    spend(T_.cost);
    b.recent = [ghost.by, ...b.recent.filter((x) => x !== ghost.by)].slice(0, RECENT);
    keep();
    if (window.Track) window.Track('battle_start', { tier });
    window.Game.start({ mode: 'battle', n: T_.n, seed: ghost.seed, tier, ghost: Object.assign({}, ghost, { name: shownName(ghost) }), me: (await nick()) || T('battle.me') });
  }

  /** 판이 끝났을 때(game.js). why: 'clear' | 'ghost' | 'mistakes' | 'quit'. 결과 창에 쓸 것들을 돌려준다 */
  function finish(won, tier, why) {
    const s = recordResult(won, tier);
    if (window.Track) window.Track(won ? 'battle_won' : 'battle_lost', { tier, why });
    if (s.up && window.Track) window.Track('battle_season_up', { tier: SEASON[tierIdx(s.after)][0] });
    const t = b.tiers[tier];
    return {
      record: T('battle.record', { w: b.won, l: b.lost }) + ' · ' + T('battle.rate', { r: Math.round(rate(b.won, b.lost) * 100) }),
      season: s.up ? T('battle.season.up', { t: T('battle.tier.' + SEASON[tierIdx(s.after)][0]) })
        : s.after > s.before ? T('battle.season.gain', { n: s.after - s.before, p: s.after })
        : s.after < s.before ? T('battle.season.loss', { n: s.before - s.after, p: s.after })
        : T('battle.season.keep', { p: s.after }),
      emblem: `awards/season/${SEASON[tierIdx(s.after)][0]}.webp`,
      again: tickets() >= TIERS[tier].cost,
      tierRecord: T('battle.record', { w: t.won, l: t.lost }),
    };
  }

  // ── 티켓 더 받기 (보상형 광고) ──
  function askTickets() {
    const ad = window.Ads && window.Ads.isNative;
    window.Game.modal({
      title: tickets() < TIERS.n6.cost ? T('battle.noTickets') : T('battle.tickets', { n: tickets() }),
      body: T('battle.nextTicket', { m: nextTicketMin() }),
      actions: [
        ...(ad ? [{ label: T('battle.ticketAd', { n: TICKETS_PER_AD }), fn: () => { window.Game.hideModal(); watchAd(); } }] : []),
        { label: T('battle.ok'), kind: 'ghost', fn: () => window.Game.hideModal() },
      ],
    });
  }
  async function watchAd() {
    const got = await window.Ads.rewarded();
    if (got === null) { window.Game.toast(T('ad.noFill')); return; }
    if (!got) return;
    refill();
    b.tickets.n += TICKETS_PER_AD;
    keep();
    if (window.Track) window.Track('ad_watched', { place: 'tickets' });
    window.Game.toast(T('battle.ticketGot', { n: TICKETS_PER_AD }));
    render();
  }

  // ── 대결 탭 (클래식 스도쿠 BattleView 순서: 시즌 카드 → VS 전적 판 → 티켓 → 대결 버튼) ──
  let seasonHelp = false;
  function render() {
    const root = $('battleBody');
    if (!root) return;
    if (!b.seen) { b.seen = true; keep(); paintDot(); }
    if (!unlocked()) {
      const n = Math.min(d.stats.solved, UNLOCK);
      root.innerHTML =
        `<div class="card battle-locked"><img src="icons/lock.webp" alt="" aria-hidden="true">` +
        `<p class="bl-title">${T('battle.locked', { n: UNLOCK })}</p>` +
        `<span class="bar"><span class="bar-fill" style="width:${(n / UNLOCK) * 100}%"></span></span>` +
        `<b>${n} / ${UNLOCK}</b>` +
        `<button id="battleGoPlay" class="btn btn-primary" type="button">${T('battle.lockedGo')}</button>` +
        `<p class="battle-how">${T('battle.how')}</p></div>`;
      $('battleGoPlay').addEventListener('click', () => window.Home && window.Home.show('home'));
      return;
    }
    const s = season(), tk = tickets(), r6 = b.tiers.n6, T6 = TIERS.n6;
    if (Toss && !b.nick && !myName && !render.asked) { render.asked = true; nick().then((n) => { if (n) render(); }); }
    const shown = b.nick || myName;
    // 내 이름 줄 — 누르면 바꾸기(없으면 정하기)
    const me = shown
      ? `<button id="nickEdit" class="nick-row" type="button"><span>${T('battle.nickShown')}</span><b>${esc(shown)} <i>${T('battle.nickChange')} ›</i></b></button>`
      : `<button id="nickEdit" class="nick-row nick-none" type="button"><span>${T('battle.nickNone')}</span><b>${T('battle.nickMake')} ›</b></button>`;
    const winPct = b.won + b.lost ? Math.round(rate(b.won, b.lost) * 100) + '%' : '-';
    root.innerHTML = me +
      // 이번 달 시즌 — 누르면 규칙이 카드 안에 펼쳐진다
      `<button id="seasonCard" class="card season-card" type="button">` +
      `<img class="season-emblem" src="awards/season/${s.tier}.webp" alt="">` +
      `<span class="season-text">` +
      `<span class="season-title">${T('battle.season.title', { m: s.month, t: `<b>${T('battle.tier.' + s.tier)}</b>` })}</span>` +
      `<span class="season-pts">${T('battle.season.points', { p: s.points })}</span>` +
      `<span class="bar"><span class="bar-fill" style="width:${Math.round(s.frac * 100)}%"></span></span>` +
      `<span class="season-sub">${s.next ? T('battle.season.toNext', { t: T('battle.tier.' + s.next), n: s.toNext }) : T('battle.season.top')} · ${T('battle.season.daysLeft', { n: s.daysLeft })}</span>` +
      (seasonHelp ? `<span class="season-how">${T('battle.season.how')}</span>` : '') +
      `</span></button>` +
      // VS 전적 판
      `<section class="battle-hero"><div class="battle-vs-art" aria-hidden="true"><span class="vs-v">V</span><span class="vs-s">S</span></div>` +
      `<dl class="battle-stats"><div><dd class="battle-rate">${winPct}</dd><dt>${T('battle.winRate')}</dt></div>` +
      `<div><dd>${b.won}</dd><dt>${T('battle.wins')}</dt></div><div><dd>${b.lost}</dd><dt>${T('battle.losses')}</dt></div></dl></section>` +
      // 티켓
      `<div class="battle-tickets"><button id="ticketPill" class="ticket-pill" type="button" aria-label="${T('battle.ticketAd', { n: TICKETS_PER_AD })}">🎟️ ${tk}<i aria-hidden="true">+</i></button>` +
      `<p class="battle-refill">${tk >= TICKET_MAX ? T('battle.ticketsFull') : T('battle.nextTicket', { m: nextTicketMin() })}</p></div>` +
      // 대결 버튼
      `<div class="battle-gos"><button class="battle-go${tk < T6.cost ? ' short' : ''}" type="button" data-tier="n6">` +
      `<span class="bg-name">${T('battle.start')}</span>` +
      `<span class="bg-sub">${T6.n}×${T6.n} · 🎟️×${T6.cost}</span>` +
      (r6.won + r6.lost ? `<span class="bg-rec">${T('battle.record', { w: r6.won, l: r6.lost })}</span>` : '') +
      `</button><p class="battle-how">${T('battle.how')}</p></div>`;
    root.querySelectorAll('[data-tier]').forEach((el) => el.addEventListener('click', () => { sfx('tap'); start(el.dataset.tier); }));
    $('ticketPill').addEventListener('click', askTickets);
    $('nickEdit').addEventListener('click', () => { sfx('tap'); editNick(); });
    $('seasonCard').addEventListener('click', () => { seasonHelp = !seasonHelp; sfx('tap'); render(); });
  }

  // 대결 탭 NEW 점 — 열린 뒤 아직 한 번도 안 열어 본 사람
  function paintDot() {
    const tb = $('tb-battle');
    if (tb) tb.classList.toggle('dot', unlocked() && !b.seen);
  }

  function mount() {
    const tb = $('tb-battle');
    if (tb) tb.hidden = !open;
    paintDot();
  }
  document.addEventListener('DOMContentLoaded', mount);
  mount();

  window.Battle = {
    open, TIERS, tierOfSize, ghostAt, upload, start, finish, render, record, months, season,
    tickets: () => tickets(), cost: (tier) => TIERS[tier].cost,
  };
})();
