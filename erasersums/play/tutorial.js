/* 지우개 셈 — 첫 판 손잡아 주기
 *
 * 규칙을 글로 읽으면 안 읽는다. 그래서 처음 여는 판 위에서 **네 번만** 짚어 준다.
 *   1) 줄 바깥 숫자가 무엇인지 (합 숫자를 눌러 보게 한다 — 말풍선이 스스로 설명한다)
 *   2) 지우개로 필요 없는 숫자 지우기 (지울 칸 하나만 받는다)
 *   3) 남기기로 동그라미 치기 (도구를 바꾸게 하고, 남길 칸 하나만 받는다)
 *      도구 버튼은 판 밖 아래쪽이라 고리만으로는 잘 안 보인다 — 손가락이 버튼을 톡톡 누른다(hand)
 *   4) 나머지는 직접 — 안내를 걷는다
 *
 * 색깔 묶음(6×6 판부터)은 처음 만나는 판에서 한 장만 따로 보여 준다. 묶음 하나를 밝히고
 * 왼쪽 위 작은 숫자에 고리를 친다. 판을 막지 않는다 — 판을 누르면 말이 닫히고 그 수도 둔다.
 *
 * 판을 따로 만들지 않는다. 지금 연 판에서 '지울 칸'과 '남길 칸'을 하나씩 골라 쓰므로
 * 여정 1단계든 바로 시작하기든 어디서 시작해도 된다.
 *
 * 안내 중에는 짚어 준 곳만 눌리고(game.js 의 act 가 allows 로 묻는다), 다른 데를 누르면
 * 말풍선이 한 번 흔들린다. 틀릴 일이 없으니 첫 판에서 하트가 깎이지 않는다.
 */
(function () {
  'use strict';
  const St = window.Store;
  const $ = (id) => document.getElementById(id);
  const sfx = (n, at) => { if (window.Sfx) window.Sfx(n, at); };

  let ctx = null;     // { keep, n, cells, clues, lines }
  let steps = [], at = -1, ring = null;
  let again = false;  // '다시 보기'로 부른 경우 — 이미 여러 판 푼 사람에게도 보여 준다

  const box = () => $('coach');
  const active = () => at >= 0 && at < steps.length;
  const step = () => (active() ? steps[at] : null);

  /** 짚어 주는 곳에 고리를 옮긴다 */
  function point(el) {
    if (ring) ring.classList.remove('coach-on');
    ring = el || null;
    if (ring) ring.classList.add('coach-on');
  }

  // 손가락 — 판 밖에서 눌러야 하는 곳(도구 바꾸기)을 톡톡 누르는 손.
  // 끝은 버튼 오른쪽 위(그림 옆)에 둔다 — 가운데에 두면 손이 버튼 이름(‘남기기’)을 가린다
  let hand = null, handAt = null;
  function pointHand(el) {
    handAt = el || null;
    if (!handAt) { if (hand) hand.hidden = true; return; }
    if (!hand) {
      hand = document.createElement('div');
      hand.className = 'coach-hand';
      hand.setAttribute('aria-hidden', 'true');
      hand.textContent = '\u{1F446}';   // 👆
      document.body.appendChild(hand);
    }
    const r = handAt.getBoundingClientRect();
    hand.style.left = `${r.left + r.width * 0.86}px`;
    hand.style.top = `${r.top + r.height * 0.35}px`;
    hand.hidden = false;
  }
  // 화면이 돌거나 크기가 바뀌면 따라간다
  window.addEventListener('resize', () => { if (handAt) pointHand(handAt); });

  // 묶음 안내 때 밝혀 두는 칸들
  let lit = [];
  function light(els) {
    lit.forEach((e) => e.classList.remove('coach-lit'));
    lit = els || [];
    lit.forEach((e) => e.classList.add('coach-lit'));
  }

  function show() {
    const s = step();
    if (!s) return stop();
    $('coachText').textContent = s.text;
    // 설명만 하는 장(마지막 말·묶음 안내)은 버튼이 '알겠어요', 그 전에는 '건너뛰기'
    $('coachSkip').textContent = T(s.last ? 'tut.ok' : 'tut.skip');
    box().hidden = false;
    point(s.at());
    pointHand(s.hand ? s.at() : null);
  }

  function next() {
    at++;
    if (at >= steps.length) { done(); return; }
    // 그림이 움직이는 동안 기다렸다 다음 말을 건다
    setTimeout(show, step() && step().wait ? step().wait : 0);
  }

  /** 엉뚱한 데를 눌렀을 때 — 말풍선만 한 번 흔든다(하트는 안 깎인다) */
  function nudge() {
    const b = box();
    b.classList.remove('nudge'); void b.offsetWidth; b.classList.add('nudge');
    sfx('deny');
  }

  function stop() {
    at = -1; steps = []; ctx = null;
    point(null);
    pointHand(null);
    light(null);
    box().hidden = true;
  }

  function done() {
    const s = step();
    again = false;
    if (s && s.region) {
      St.d.regionTutorialDone = true;
      if (window.Track) window.Track('tutorial_region_done', {});
    } else {
      St.d.tutorialDone = true;
      if (window.Track) window.Track('tutorial_done', {});
    }
    St.save();
    stop();
  }

  /** 지금 이 칸을 눌러도 되나 (game.js 의 act 가 묻는다) */
  function allows(i) {
    const s = step();
    if (!s) return true;
    // 설명만 하는 장이 떠 있을 때는 판을 그냥 둘 수 있다. 말은 '알겠어요'를 누를 때까지 남는다
    if (s.last) return true;
    if (s.cell === undefined) { nudge(); return false; }   // 지금은 칸 차례가 아니다
    if (s.cell !== i) { nudge(); return false; }
    return true;
  }

  function acted(i) {
    const s = step();
    if (s && s.cell === i) next();
  }

  function toolChanged(tool) {
    const s = step();
    if (s && s.tool === tool) next();
  }

  function clued() {
    const s = step();
    if (s && s.clue) next();
  }

  /** 판을 다 풀었을 때 — 설명 장이 아직 떠 있으면 본 것으로 치고 닫는다 */
  function finish() {
    const s = step();
    if (s && s.last) done();
    else if (active()) stop();
  }

  /** 첫 판이면 안내를 시작한다. c = { keep, n, cells, clues, lines } */
  function maybe(c) {
    if (!St.d.tutorialDone) {
      if (again || St.d.stats.solved === 0) return begin(c);   // 예전 사람에게 갑자기 띄우지 않는다
    }
    if (c.groups && !St.d.regionTutorialDone) {
      // 6×6 이상을 이미 깬 사람은 묶음을 안다
      const big = [6, 7, 8, 9].some((n) => ((St.d.stats.sizes || {})[n] || {}).won > 0);
      if (!big || again) return beginRegion(c);
    }
    return false;
  }

  /** 색깔 묶음 안내 한 장 */
  function beginRegion(c) {
    ctx = c;
    // 가장 큰 묶음을 고른다 — 여럿 칸이라 한눈에 '묶음' 으로 보인다
    let gi = 0;
    c.groups.forEach((g, i) => { if (g.cells.length > c.groups[gi].cells.length) gi = i; });
    const g = c.groups[gi];
    steps = [{
      text: T('tut.region'),
      region: true,
      last: true,
      at: () => c.cells[g.anchor],
    }];
    at = 0;
    show();
    light(g.cells.map((i) => c.cells[i]));
    if (window.Track) window.Track('tutorial_region_start', {});
    return true;
  }

  /** 설정 → 게임 방법에서 '다시 보기'. 다음에 여는 판에서 안내가 붙는다. */
  function replay() {
    again = true;
    St.d.tutorialDone = false;
    St.d.regionTutorialDone = false;
    St.save();
  }

  function begin(c) {
    ctx = c;
    const N = c.n * c.n;
    // 첫 줄(가로)에서 지울 칸과 남길 칸을 하나씩 고른다 — 같은 줄이라야 설명이 이어진다
    let row = 0, erase = -1, keep = -1;
    for (let r = 0; r < c.n && (erase < 0 || keep < 0); r++) {
      let e = -1, k = -1;
      for (let x = 0; x < c.n; x++) {
        const i = r * c.n + x;
        if (!c.keep[i] && e < 0) e = i;
        if (c.keep[i] && k < 0) k = i;
      }
      if (e >= 0 && k >= 0) { row = r; erase = e; keep = k; }
    }
    if (erase < 0 || keep < 0) return false;   // 있을 수 없지만, 없으면 그냥 안 한다
    const rowClue = c.lines.findIndex((L) => L.kind === 'r' && L.idx === row);

    steps = [
      {
        text: T('tut.1'),
        clue: true,
        at: () => c.clues[rowClue],
      },
      {
        text: T('tut.2'),
        cell: erase,
        wait: 400,
        at: () => c.cells[erase],
      },
      {
        text: T('tut.3'),
        tool: 'keep',
        wait: 500,
        hand: true,
        at: () => $('modeKeep'),
      },
      {
        text: T('tut.4'),
        cell: keep,
        at: () => c.cells[keep],
      },
      {
        text: T('tut.5'),
        wait: 500,
        at: () => null,
        last: true,
      },
    ];
    at = -1;
    next();
    if (window.Track) window.Track('tutorial_start', {});
    return true;
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('coachSkip').addEventListener('click', () => { done(); sfx('close'); });
    // 마지막 말은 눌러서 닫는다
    box().addEventListener('click', (e) => {
      if (e.target.id === 'coachSkip') return;
      if (step() && step().last) done();
    });
  });

  window.Tutorial = { maybe, begin, replay, allows, acted, toolChanged, clued, stop, finish, active };
})();
