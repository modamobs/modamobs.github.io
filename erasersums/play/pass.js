/* 지우개 셈 — 월간 패스 (클래식 스도쿠 season/pass.ts · ui/PassView.tsx 를 옮김)
 *
 * 그달 판을 깨며 패스 별을 모으고, 별 칸마다 보상을 받는다. 달이 바뀌면 처음부터.
 *   별     판 하나 ★1, 실수 없이 +1, 그날 오늘의 퍼즐을 처음 풀면 +2 (game.js 가 판을 깰 때 onWin)
 *          매일 데일리 + 다섯 판쯤(반은 실수 없이) 하면 하루 10개 → 한 달 300개. 그만큼 하는 사람이 끝까지 간다
 *   보상   칸마다 힌트(지우개 셈에 있는 물건은 힌트뿐). 앞쪽은 촘촘하게 — 첫날 두세 판이면 두세 칸이 열린다.
 *          끝 칸(300)은 토스에서 토스포인트도(toss.js 가 PassToss 를 채우면) — 한 판 광고 수익이 0.4~0.8원이라
 *          끝까지 간 사람(150판 넘게)에게서 60원쯤 번다. 30원이면 남는다
 *   받기   사람이 누른다 — 누르는 맛이 패스의 절반(스도쿠). 둘 이상이면 「모두 받기」.
 *          달이 바뀌면 못 받은 칸은 넣어 주고 다시 시작한다. 토스포인트는 그달 안에 받아야 한다
 * 홈에는 줄 목록 맨 위 한 줄(스도쿠 홈 시안 A) — 받을 보상이 있으면 이름 옆에 주황 알약.
 * 저장은 Store.d.pass = { m: 'YYYY-MM', s: 별, c: [받은 칸의 별 수], t: 토스포인트 받음 }. 클라우드 저장(games.js)도 합친다.
 */
(function () {
  'use strict';
  const St = window.Store;
  const d = St.d;
  const $ = (id) => document.getElementById(id);
  const sfx = (n) => { if (window.Sfx) window.Sfx(n); };

  const STEPS = [
    { at: 3, hints: 1 }, { at: 6, hints: 1 }, { at: 10, hints: 1 }, { at: 15, hints: 1 }, { at: 20, hints: 1 },
    { at: 30, hints: 1 }, { at: 40, hints: 1 }, { at: 50, hints: 1 }, { at: 65, hints: 1 }, { at: 80, hints: 1 },
    { at: 100, hints: 2 }, { at: 125, hints: 1 }, { at: 150, hints: 2 }, { at: 175, hints: 1 }, { at: 200, hints: 2 },
    { at: 250, hints: 2 }, { at: 300, hints: 3 },
  ];
  const LAST = STEPS[STEPS.length - 1].at;
  const GOAL = LAST;

  const monthKey = () => St.dateKey().slice(0, 7);
  /** 끝 칸의 토스포인트 — toss.js 가 { amount, claim() → Promise<'ok'|코드> } 를 넣는다. 토스 밖이면 없다 */
  const toss = () => window.PassToss || null;

  /** 달이 바뀌었으면 지난달에 못 받은 칸의 힌트를 넣어 주고 새 달로. 넣어 준 힌트 수 */
  function roll() {
    const m = monthKey();
    const p = d.pass;
    if (p && p.m === m) return 0;
    let late = 0;
    if (p) for (const s of STEPS) if (p.s >= s.at && !p.c.includes(s.at)) late += s.hints;
    d.pass = { m, s: 0, c: [] };
    if (late) d.hints += late;
    St.save();
    return late;
  }
  const cur = () => { roll(); return d.pass; };
  const readyOf = (p) => STEPS.filter((s) => p.s >= s.at && !p.c.includes(s.at));
  const nextOf = (p) => STEPS.find((s) => p.s < s.at) || null;
  /** 끝 칸을 받았는데 토스포인트가 아직 — 「포인트 받기」를 남긴다 */
  const tossWait = (p) => !!(toss() && p.c.includes(LAST) && !p.t);

  /** 판을 깼을 때(game.js). 결과 창 배지에 쓴다 */
  function onWin({ mistakes, dailyFirst }) {
    const p = cur();
    const got = 1 + (mistakes === 0 ? 1 : 0) + (dailyFirst ? 2 : 0);
    const opened = STEPS.filter((s) => p.s < s.at && p.s + got >= s.at).length;
    p.s += got;
    St.save();
    return { got, opened };
  }
  /** 결과 창 배지. 누르면 판을 나와 패스 화면으로(받기는 거기서) */
  function winLine(r) {
    return '<br><button type="button" class="pass-badge' + (r.opened ? ' opened' : '') + '" data-pass-open>★ ' +
      (r.opened ? T('pass.opened', { n: r.opened }) + ' · ' : '') + T('pass.earned', { n: r.got }) + ' ›</button>';
  }

  // ── 홈 줄 ──
  function paintBand() {
    const p = cur(), ready = readyOf(p), next = nextOf(p);
    $('passRowPill').hidden = !ready.length;
    $('passRowPill').textContent = T('pass.ready', { n: ready.length });
    $('passBandMeter').style.width = Math.max(2, Math.min(100, (p.s / GOAL) * 100)) + '%';
    // 토스에서 이번 달 아직 안 받았으면 완주 포인트를, 아니면 다음 칸까지
    $('passRowSub').textContent = toss() && !p.t ? T('pass.tossGoal', { g: GOAL, n: toss().amount })
      : next ? T('pass.toNext', { n: next.at - p.s }) : T('pass.allShort');
  }

  // ── 패스 화면 ──
  function leftText() {
    const now = new Date();
    const ms = new Date(now.getFullYear(), now.getMonth() + 1, 1) - now;
    const h = Math.max(0, Math.floor(ms / 3600000));
    return h >= 24 ? T('pass.leftDays', { d: Math.floor(h / 24), h: h % 24 }) : T('pass.leftHours', { h, m: Math.floor((ms % 3600000) / 60000) });
  }
  function render() {
    const p = cur(), ready = readyOf(p), next = nextOf(p);
    $('passTitle').textContent = T('pass.month', { m: St.parseKey(St.dateKey()).m });
    $('passLeft').textContent = leftText();
    $('passStars').textContent = p.s;
    $('passGoal').textContent = GOAL;
    $('passAll').hidden = ready.length < 2;
    $('passAll').textContent = T('pass.claimAll', { n: ready.length });
    $('passMeter').style.width = Math.min(100, (p.s / GOAL) * 100) + '%';
    $('passSub').textContent = next ? T('pass.next', { n: next.at - p.s }) : T('pass.allOpen');
    $('passTossGoal').hidden = !toss() || !!p.t;
    if (toss()) $('passTossGoal').textContent = T('pass.tossGoal', { g: GOAL, n: toss().amount });
    let html = '';
    STEPS.forEach((s, i) => {
      const open = p.s >= s.at, got = p.c.includes(s.at), wait = s.at === LAST && tossWait(p);
      html += `<li class="pass-step${i % 2 ? ' right' : ''}${open ? ' open' : ''}" data-step="${s.at}">` +
        `<span class="pass-node">${s.at}</span>` +
        `<div class="pass-tile${got && !wait ? ' got' : ''}${(open && !got) || wait ? ' ready' : ''}">` +
        (!open ? '<img class="pass-lock" src="icons/lock.webp" alt="">' : '') +
        (got ? '<span class="pass-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 6.5"/></svg></span>' : '') +
        '<img class="pass-icon" src="icons/bulb.webp" alt="">' +
        `<span class="pass-amount">${T('pass.hints', { n: s.hints })}</span>` +
        (s.at === LAST && toss() ? `<span class="pass-toss"><img src="icons/coin.webp" alt="">${T('pass.points', { n: toss().amount })}</span>` : '') +
        (open && !got ? `<button type="button" class="pass-claim" data-at="${s.at}">${T('pass.claim')}</button>` : '') +
        (wait ? `<button type="button" class="pass-claim" data-toss>${T('pass.tossRetry')}</button>` : '') +
        '</div></li>';
    });
    $('passList').innerHTML = html;
  }

  function toast(msg) { if (window.Game) window.Game.toast(msg); }
  function after() {
    St.save();
    sfx('star');
    render();
    paintBand();
    if ($('bHints')) $('bHints').textContent = d.hints;
  }

  // 끝 칸을 받았으면 토스포인트도 지급해 본다. 성공했을 때만 적는다 — 실패하면 끝 칸에 「포인트 받기」가 남는다
  let busy = false;
  async function tryToss() {
    const p = cur();
    if (!tossWait(p) || busy) return;
    busy = true;
    let r;
    try { r = await toss().claim(); } catch (e) { r = 'error'; }
    busy = false;
    if (window.Track) window.Track('pass_toss', { r });
    if (r !== 'ok') { toast(T('pass.fail')); render(); return; }
    p.t = 1;
    after();
    toast(T('toss.promo.got', { n: toss().amount }));
  }

  function claim(at) {
    const p = cur(), s = STEPS.find((x) => x.at === at);
    if (!s || p.s < at || p.c.includes(at)) return;
    p.c.push(at);
    d.hints += s.hints;
    if (window.Track) window.Track('pass_claim', { at });
    after();
    toast(T('pass.gotHints', { n: s.hints }));
    if (at === LAST) tryToss();
  }
  function claimAll() {
    const p = cur(), ready = readyOf(p);
    if (!ready.length) return;
    let n = 0;
    for (const s of ready) { p.c.push(s.at); n += s.hints; }
    d.hints += n;
    if (window.Track) window.Track('pass_claim', { at: ready[ready.length - 1].at, all: ready.length });
    after();
    toast(T('pass.gotHints', { n }));
    if (p.c.includes(LAST)) tryToss();
  }

  function open() {
    render();
    $('pass').hidden = false;
    sfx('open');
    if (window.Track) window.Track('pass_open', { s: cur().s });
    // 받을 칸이 있으면 그 첫 칸, 없으면 다음에 열릴 칸이 가운데 오게. 앞쪽 칸이면 내리지 않는다
    const p = cur(), first = readyOf(p)[0] || nextOf(p) || STEPS[STEPS.length - 1];
    const box = $('passScroll');
    box.scrollTop = 0;
    if (STEPS.indexOf(first) >= 4) {
      const li = box.querySelector(`[data-step="${first.at}"]`);
      if (li) box.scrollTop = li.offsetTop - box.clientHeight / 2 + li.offsetHeight / 2;
    }
  }
  function close() {
    if ($('pass').hidden) return false;
    $('pass').hidden = true;
    sfx('close');
    paintBand();
    return true;
  }

  $('hPass').addEventListener('click', open);
  $('passBack').addEventListener('click', close);
  $('passAll').addEventListener('click', claimAll);
  $('passList').addEventListener('click', (e) => {
    const b = e.target.closest('[data-at], [data-toss]');
    if (!b) return;
    if (b.hasAttribute('data-toss')) tryToss(); else claim(+b.dataset.at);
  });
  // 결과 창 배지 → 판을 나와 패스 화면
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-pass-open]') || !window.Game) return;
    window.Game.hideModal();
    window.Game.exit();
    setTimeout(open, 0);
  });
  document.addEventListener('langchange', () => { paintBand(); if (!$('pass').hidden) render(); });

  // 켤 때 달을 넘겼으면 알린다
  const late = roll();
  if (late) setTimeout(() => toast(T('pass.late', { n: late })), 1200);
  paintBand();

  window.Pass = { onWin, winLine, open, close, closeTop: close, paintBand, GOAL };
})();
