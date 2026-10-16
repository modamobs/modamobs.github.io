/* 지우개 셈 — 판 화면·입력·소리
 *
 * 판 하나 = run: { mode, level?, date?, seed?, n? }
 *   level   레벨 이어 가기 (레벨 번호가 씨앗)
 *   daily   오늘의 퍼즐 (날짜가 씨앗, 요일마다 크기)
 *   free    새 게임 (크기를 고르고 씨앗은 무작위)
 *   relaxed 하트 없이 (틀려도 하트가 줄지 않는다)
 *   battle  1:1 대결 (토스. battle.js) — 상대 기록(ghost)과 같은 씨앗의 판. 힌트·이어하기·저장 없음
 *
 * 기록(trace): 칸이 정해진 시각(ok)과 틀린 시각(bad)을 0.1초 단위로 적는다. 6×6 판을 처음부터 힌트 없이
 * 끝까지 하면 대결 상대 기록으로 올린다(battle.js upload).
 */
(function () {
  'use strict';
  const CS = window.CrossSum, St = window.Store;
  const MAX_HEARTS = 3;
  const $ = (id) => document.getElementById(id);

  const RING = '<svg class="ring" viewBox="0 0 100 100" aria-hidden="true"><path pathLength="1" d="M72 20C54 8 24 12 14 36C5 58 22 86 50 87C76 88 92 66 87 44C83 27 68 16 50 15"/></svg>';
  const HEART = '<span class="heart"><img class="h-full" src="icons/heart.webp" alt=""><img class="h-empty" src="icons/heart-empty.webp" alt=""></span>';

  const TIPS = [1, 2, 3, 4];   // 여정 앞 단계에서 한 줄씩 (문구는 i18n.js 의 tip.N). 색깔 묶음은 tutorial.js 가 따로
  // 판 만드는 방식이 바뀌면 올린다 — 예전 판의 저장은 버린다
  const PV = 4; // 3: 여정 짜임으로 단계별 판 크기가 바뀜 · 4: 색깔 묶음이 6×6 부터(5×5 이하 판이 바뀜)

  const S = {
    run: null, tool: 'erase',
    p: null, lines: null, state: null,
    hearts: MAX_HEARTS, mistakes: 0,
    elapsed: 0, t0: 0, running: false,
    over: false, cleared: false,
    trace: null, fresh: false, continued: false, battle: null,
  };
  const relaxed = () => S.run && S.run.mode === 'relaxed';
  const inBattle = () => !!(S.run && S.run.mode === 'battle');
  const ds = () => Math.round(elapsed() / 100);

  function elapsed() { return S.elapsed + (S.running ? performance.now() - S.t0 : 0); }

  // ── 판 고르기·저장 ─────────────────────────────────────
  function puzzleFor(run) {
    if (run.mode === 'level') return CS.generate(run.level);
    if (run.mode === 'daily') return CS.generateSeeded(St.dailySeed(run.date), St.dailySize(run.date));
    return CS.generateSeeded(run.seed, run.n);
  }
  function sameRun(a, b) {
    if (!a || a.mode !== b.mode) return false;
    if (a.pv !== PV && !(a.pv === 3 && a.n >= 6)) return false;   // 6×6 이상은 PV 3 판이 그대로다
    if (b.mode === 'level') return a.level === b.level;
    if (b.mode === 'daily') return a.date === b.date;
    return a.seed === b.seed && a.n === b.n;
  }
  function titleOf(run) {
    if (run.mode === 'battle') return T('battle.tier.' + run.tier);
    if (run.mode === 'level') return T('game.title.stage', { n: run.level });
    if (run.mode === 'daily') { const { y, m, d } = St.parseKey(run.date); return window.I18n.fmtDate(y, m, d); }
    if (run.mode === 'relaxed') return T('home.relax');
    return T('game.title.free');
  }

  function persist() {
    if (S.run && !S.cleared && !inBattle()) {
      const r = S.run;
      St.d.boards[r.mode] = {
        pv: PV, mode: r.mode, level: r.level, date: r.date, seed: r.seed, n: S.p.n,
        state: Array.from(S.state), hearts: S.hearts, mistakes: S.mistakes, hintsUsed: S.hintsUsed, elapsed: Math.round(elapsed()),
      };
    }
    St.save();
  }

  // ── 소리·진동 ─────────────────────────────────────────
  // 소리는 sound.js 가 만든다(홈·여정도 같은 것을 쓴다). 설정에서 끄면 거기서 막힌다.
  const sfx = (name, atMs, i) => { if (window.Sfx) window.Sfx(name, atMs, i); };

  function buzz(pattern) {
    if (!St.d.vibe || !navigator.vibrate) return;
    try { navigator.vibrate(pattern); } catch (e) { /* 막힌 곳도 있다 */ }
  }

  // ── 판 그리기 ─────────────────────────────────────────
  const board = $('board'), wrap = $('boardWrap');
  let cellEls = [], clueEls = [], heartEls = [];

  function build() {
    const { n, nums, rows, cols, groups, region } = S.p;
    board.textContent = '';
    board.style.setProperty('--n', n);
    board.classList.toggle('big', n >= 8);
    board.classList.toggle('regions', !!groups);
    const corner = document.createElement('div');
    const top = document.createElement('div'); top.className = 'clues clues-top';
    const left = document.createElement('div'); left.className = 'clues clues-left';
    const grid = document.createElement('div'); grid.className = 'grid';
    // 줄 순서와 같게: 가로 0..n-1, 세로 n..2n-1, 묶음 2n..
    clueEls = new Array(2 * n + (groups ? groups.length : 0));
    for (let c = 0; c < n; c++) clueEls[n + c] = top.appendChild(makeClue(cols[c], `${c + 1}번째 세로줄 합 ${cols[c]}`, n + c));
    for (let r = 0; r < n; r++) clueEls[r] = left.appendChild(makeClue(rows[r], `${r + 1}번째 가로줄 합 ${rows[r]}`, r));
    cellEls = [];
    for (let i = 0; i < n * n; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cell';
      b.dataset.i = i;
      b.innerHTML = `<span class="num">${nums[i]}</span>${RING}`;
      b.style.setProperty('--rot', `${Math.round(Math.random() * 50 - 25)}deg`);
      if (groups) {
        const g = groups[region[i]];
        b.style.setProperty('--rc', `var(--r${g.color})`);
        // 묶음 경계 — 옆 칸이 다른 묶음이면 그쪽 변을 굵게. 칸 사이 1px 줄 양쪽에 반씩
        const x = i % n, me = region[i], e = '1.5px';
        if (x > 0 && region[i - 1] !== me) b.style.setProperty('--el', e);
        if (x < n - 1 && region[i + 1] !== me) b.style.setProperty('--er', e);
        if (i >= n && region[i - n] !== me) b.style.setProperty('--et', e);
        if (i < n * (n - 1) && region[i + n] !== me) b.style.setProperty('--eb', e);
        // 묶음의 왼쪽 위 칸에 합을 작게
        if (g.anchor === i) {
          const lab = document.createElement('span');
          lab.className = 'rlabel';
          lab.textContent = g.target;
          b.appendChild(lab);
          clueEls[2 * n + region[i]] = lab;
        }
      }
      cellEls.push(grid.appendChild(b));
    }
    board.append(corner, top, left, grid);

    $('hearts').innerHTML = HEART.repeat(MAX_HEARTS);
    heartEls = Array.from($('hearts').children);
    $('hearts').hidden = relaxed();
    $('relaxNote').hidden = !relaxed();
    $('lvText').textContent = titleOf(S.run);
    $('sizeText').textContent = `${n}×${n}`;
    const tip = S.run.mode === 'level' && TIPS.includes(S.run.level) ? T('tip.' + S.run.level) : '';
    $('tip').textContent = tip || '';
    $('tip').hidden = !tip;
    // 여정 미션 단계면 판 위에 할 일을 띄운다
    const m = S.run.mode === 'level' && window.Journey ? window.Journey.mission(S.run.level) : null;
    $('missionChip').hidden = !m;
    if (m) $('missionChip').innerHTML = `<img src="icons/target.webp" alt="">${T('game.mission', { t: window.Journey.missionText(m) })}`;
    // 단계 옮기기는 개발판에서만 (설정 탭과 같은 조건 — home.js)
    $('levelMove').hidden = S.run.mode !== 'level' || !DEV;
  }

  // 빌드할 때 --dev 를 주거나(build.mjs → window.APP.dev) 주소에 ?dev=1 을 붙인 개발판
  const DEV = !!(window.APP || {}).dev || new URLSearchParams(location.search).get('dev') === '1';

  // 합 숫자는 누르면 말풍선으로 설명한다 (그래서 버튼)
  function makeClue(value, label, li) {
    const d = document.createElement('button');
    d.type = 'button';
    d.className = 'clue';
    d.dataset.li = li;
    d.setAttribute('aria-label', label);
    // cv = 보이는 수(남은 합 보기가 켜져 있으면 남은 합), ct = 원래 합(남은 수를 보일 때만 작게)
    d.innerHTML = `<span class="cv">${value}</span><small class="ct">${value}</small>${RING}`;
    d.style.setProperty('--rot', `${Math.round(Math.random() * 40 - 20)}deg`);
    return d;
  }

  function layout() {
    if (!S.p || $('game').hidden) return;
    const n = S.p.n;
    const g = n >= 8 ? 6 : 8;
    const fixed = g + (n - 1) + 4; // 칸 사이 1px 선, 테두리 2px 양쪽
    const W = wrap.clientWidth, H = wrap.clientHeight;
    let cs = Math.floor(Math.min((W - fixed) / (n + 1), (H - fixed) / (n + 1)));
    cs = Math.max(26, Math.min(cs, 76));
    board.style.setProperty('--cs', `${cs}px`);
    board.style.setProperty('--g', `${g}px`);
  }

  function paintCell(i, delay) {
    const el = cellEls[i], v = S.state[i];
    el.style.setProperty('--d', `${delay || 0}ms`);
    el.classList.toggle('kept', v === 1);
    el.classList.toggle('erased', v === 2);
    const n = S.p.n;
    el.setAttribute('aria-label', `${Math.floor(i / n) + 1}행 ${i % n + 1}열 ${S.p.nums[i]}${v === 1 ? ' 남김' : v === 2 ? ' 지움' : ''}`);
  }
  // 남은 합 보기(설정, 기본 켬): 동그라미 친 숫자만큼 줄 합에서 빼서 보여 준다 — 머릿속 뺄셈을 덜어 준다.
  // 아직 동그라미가 없거나 다 맞춘 줄은 원래 합 그대로. 남은 수를 보일 때는 원래 합을 구석에 작게.
  function paintLeft() {
    if (!S.p || !S.lines) return;
    const on = St.d.showLeft !== false;
    S.lines.forEach((L, li) => {
      const el = clueEls[li];
      if (!el) return;
      let kept = 0;
      for (const c of L.cells) if (S.state[c] === 1) kept += S.p.nums[c];
      const partial = on && !L.done && kept > 0;
      const shown = partial ? L.target - kept : L.target;
      const v = el.querySelector('.cv');
      if (v) v.textContent = shown; else el.textContent = shown;   // 묶음 합 표(rlabel)는 글자만
      el.classList.toggle('partial', partial);
    });
  }
  St.onToggle((key) => { if (key === 'showLeft') paintLeft(); });
  function paintHearts() { heartEls.forEach((h, k) => h.classList.toggle('lost', k >= S.hearts)); }
  function paintHintBadge() {
    const b = $('hintBadge');
    if (St.d.hints > 0) { b.textContent = St.d.hints; b.classList.remove('ad'); }
    else { b.textContent = 'AD'; b.classList.add('ad'); }
  }
  function paintTool() {
    $('modeErase').setAttribute('aria-checked', String(S.tool === 'erase'));
    $('modeKeep').setAttribute('aria-checked', String(S.tool === 'keep'));
  }

  // ── 규칙 ──────────────────────────────────────────────
  function truth(i) { return S.p.keep[i] ? 1 : 2; }
  function setCell(i, v, delay) {
    if (S.trace && S.state[i] === 0 && v !== 0) S.trace.ok.push(ds());
    S.state[i] = v;
    paintCell(i, delay);
  }

  // 대결 상대 기록으로 올릴 수 있는 판: 6×6(battle.js tierOfSize), 처음부터(이어 하지 않음), 힌트·이어하기 없이
  function uploadable() {
    const r = S.run;
    if (!r || !window.Battle || !window.Battle.tierOfSize(S.p.n)) return false;
    if (!(r.mode === 'free' || r.mode === 'daily' || r.mode === 'battle')) return false;
    return S.fresh && S.hintsUsed === 0 && !S.continued;
  }
  function seedOf(r) { return r.mode === 'daily' ? St.dailySeed(r.date) : r.seed; }
  function uploadRun(won) {
    if (!uploadable()) return;
    window.Battle.upload({ n: S.p.n, seed: seedOf(S.run), ok: S.trace.ok.slice(), bad: S.trace.bad.slice(), end: ds(), won });
  }

  // 줄 마무리: 지울 칸을 다 지웠으면 나머지는 동그라미, 남길 칸을 다 쳤으면 나머지는 지움
  // (지우는 쪽은 설정 '자동 지우기'가 켜졌을 때만). 그게 다른 줄을 끝내면 이어서.
  // delay 는 칸마다 조금씩 밀어 차례로 보이게.
  function settle(silent) {
    let changed = true, delay = 0;
    const doneNow = [];
    while (changed) {
      changed = false;
      S.lines.forEach((L, li) => {
        if (L.done) return;
        let e = 0, k = 0;
        for (const c of L.cells) if (S.state[c] === 0) (S.p.keep[c] ? k++ : e++);
        if (e === 0 && k === 0) { L.done = true; doneNow.push(li); return; }
        if (e === 0 || (k === 0 && St.d.autoErase)) {
          const v = e === 0 ? 1 : 2;
          for (const c of L.cells) if (S.state[c] === 0) { delay += silent ? 0 : 45; setCell(c, v, delay); }
          changed = true;
        }
      });
    }
    doneNow.forEach((li) => {
      const el = clueEls[li];
      el.style.setProperty('--d', `${silent ? 0 : delay + 60}ms`);
      el.classList.add('done');
    });
    // 줄과 색깔 묶음은 소리가 다르다. 한 번에 여러 개가 끝나면 차례로 음이 올라간다.
    if (!silent) doneNow.forEach((li, k) => sfx(S.lines[li].kind === 'g' ? 'region' : 'line', delay + 60 + k * 110, k));

    paintLeft();
    if (S.state.every((v) => v !== 0)) win(silent ? 0 : delay);
    else persist();
  }

  function act(i) {
    if (S.over || S.state[i] !== 0) return true;
    // 첫 판 안내 중에는 짚어 준 칸만 받는다(엉뚱한 데를 눌러 하트가 깎이지 않게)
    if (window.Tutorial && window.Tutorial.active() && !window.Tutorial.allows(i)) return true;
    const want = S.tool === 'erase' ? 2 : 1;
    if (want === truth(i)) {
      setCell(i, want, 0);
      sfx(want === 2 ? 'erase' : 'circle');
      settle(false);
      if (window.Tutorial) window.Tutorial.acted(i);
      return true;
    }
    S.mistakes++;
    if (S.trace && !relaxed()) S.trace.bad.push(ds());
    const el = cellEls[i];
    el.classList.remove('bad'); void el.offsetWidth; el.classList.add('bad');
    sfx('bad'); buzz([35, 40, 60]);
    // 하트 없이: 빗금만 긋고 칸은 그대로 둔다
    if (relaxed()) { persist(); return false; }
    sfx('heart', 90);
    // 틀림: 하트 하나. 하트가 남았으면 맞는 쪽으로 바로잡아 준다.
    S.hearts--;
    const h = heartEls[S.hearts];
    if (h) { h.classList.add('lost'); h.classList.remove('pop'); void h.getBoundingClientRect(); h.classList.add('pop'); }
    if (S.hearts <= 0) {
      S.over = true;
      uploadRun(false);   // 하트를 다 쓴 판도 상대 기록이 된다(세 번째 실수에서 끊긴 기록)
      persist();
      if (window.Track) window.Track('game_lost', { mode: S.run.mode, n: S.p.n, level: S.run.level || 0 });
      if (inBattle()) { battleEnd(false, 'mistakes'); return false; }
      setTimeout(showLose, 650);
      return false;
    }
    setCell(i, truth(i), 250);
    settle(false);
    return false;
  }

  function useHint() {
    if (S.over || inBattle()) return;
    if (St.d.hints > 0) St.d.hints--;
    else { giveHintByAd(); return; }   // 힌트가 없으면 광고를 보고 받는다
    S.hintsUsed++;   // 광고를 보러 가는 길에는 세지 않는다(돌아와서 다시 부를 때 센다 — 예전엔 두 번 셌다)
    if (window.Track) window.Track('hint_used', { mode: S.run.mode, left: St.d.hints });
    const h = CS.findHint(S.p, S.state);
    paintHintBadge();
    if (!h) return;
    const li = S.lines.findIndex((L) => L.kind === h.line.kind && L.idx === h.line.idx);
    const clue = clueEls[li];
    clue.classList.remove('flash'); void clue.offsetWidth; clue.classList.add('flash');
    const el = cellEls[h.cell];
    el.classList.remove('hinted'); void el.offsetWidth; el.classList.add('hinted');
    setCell(h.cell, h.value, 280);
    sfx('hint');
    settle(false);
  }

  // ── 판 시작·끝 ───────────────────────────────────────
  function start(run) {
    S.run = run;
    S.p = puzzleFor(run);
    const N = S.p.n * S.p.n;
    S.lines = S.p.lines.map((L) => ({ kind: L.kind, idx: L.idx, cells: L.cells, target: L.target, done: false }));
    S.state = new Int8Array(N);
    S.hearts = MAX_HEARTS; S.mistakes = 0; S.hintsUsed = 0; S.elapsed = 0;
    S.over = false; S.cleared = false;
    S.tool = 'erase';
    S.trace = { ok: [], bad: [] }; S.fresh = true; S.continued = false;
    S.battle = run.mode === 'battle' ? { ghost: run.ghost, tier: run.tier, outTold: false } : null;

    // 이 모드에 하던 판이 같은 판이고 칸 값이 정답과 어긋나지 않을 때만 이어서
    const slot = St.d.boards[run.mode];
    if (!S.battle && sameRun(slot, run) && Array.isArray(slot.state) && slot.state.length === N &&
        slot.state.every((v, i) => v === 0 || v === truth(i))) {
      S.state = Int8Array.from(slot.state);
      S.hearts = Math.max(0, Math.min(MAX_HEARTS, slot.hearts | 0));
      S.mistakes = slot.mistakes | 0;
      S.hintsUsed = slot.hintsUsed | 0;
      S.elapsed = slot.elapsed || 0;
      S.fresh = false;   // 중간부터 이은 판은 기록이 빠져 있어 상대 기록으로 못 쓴다
    }

    hideModal(); closeSheet(); hideBubble();
    $('home').hidden = true;
    $('game').hidden = false;
    if (window.Ads && window.Ads.banner) window.Ads.banner(true);   // 배너는 판 화면에서만
    board.classList.add('instant');
    build();
    layout();
    for (let i = 0; i < N; i++) paintCell(i, 0);
    paintHearts(); paintHintBadge(); paintTool();
    $('btnHint').hidden = !!S.battle;
    $('battleBar').hidden = !S.battle;
    sfx('page');
    // 처음 여는 판이면 손을 잡아 준다(tutorial.js). 대결 판에서는 안 한다
    if (window.Tutorial && !S.battle) window.Tutorial.maybe({ keep: S.p.keep, n: S.p.n, cells: cellEls, clues: clueEls, lines: S.lines, groups: S.p.groups });
    S.t0 = performance.now();
    S.running = !S.battle;   // 대결은 상대 소개가 끝나야 시계가 돈다
    settle(true);
    if (S.battle) battleIntro(run);
    if (window.Track) window.Track('game_start', { mode: run.mode, n: S.p.n, level: run.level || 0 });
    requestAnimationFrame(() => requestAnimationFrame(() => board.classList.remove('instant')));
    if (!relaxed() && S.hearts <= 0 && !S.cleared) { S.over = true; showLose(); }
  }

  // 나가기. 여정 단계였으면 지도로 돌아간다(toMap), 아니면 홈으로.
  function exit(toMap) {
    if (inBattle() && !S.over) { askQuit(); return; }
    clearInterval(tickTimer);
    $('vsIntro').hidden = true;
    if (S.running) { S.elapsed += performance.now() - S.t0; S.running = false; }
    persist();
    hideModal(); closeSheet(); hideBubble();
    if (window.Tutorial) window.Tutorial.stop();
    $('game').hidden = true;
    $('home').hidden = false;
    if (window.Ads && window.Ads.banner) window.Ads.banner(false);
    if (Game.onExit) Game.onExit({ map: toMap === true && S.run && S.run.mode === 'level' });
  }

  function win(delay) {
    if (S.cleared) return;
    if (window.Tutorial) window.Tutorial.finish();
    S.elapsed = elapsed(); S.running = false;
    S.over = true; S.cleared = true;
    if (window.Ads && window.Ads.noteWin) window.Ads.noteWin();   // 전면 광고는 깬 판 셋마다(ads.js)
    const r = S.run, n = S.p.n, st = St.d.stats;
    st.solved++;
    if (S.mistakes === 0) st.perfect++;
    St.noteWin(n, S.mistakes); // 크기별 별 (새 게임 창의 Lv·★)
    if (!st.best[n] || S.elapsed < st.best[n]) st.best[n] = Math.round(S.elapsed);
    delete St.d.boards[r.mode];
    uploadRun(true);
    // 월간 패스(pass.js): 판마다 별. 그날 오늘의 퍼즐을 처음 푼 판은 더 — 아래에서 daily 에 넣기 전에 본다
    const passGot = window.Pass ? window.Pass.onWin({ mistakes: S.mistakes, dailyFirst: r.mode === 'daily' && !St.d.daily.includes(r.date) }) : null;
    if (inBattle()) {
      St.save();
      const fresh = window.Achievements ? window.Achievements.noteWin({ hintsUsed: S.hintsUsed }) : [];
      if (window.Track) window.Track('game_won', { mode: r.mode, n, level: 0, mistakes: S.mistakes, hints: 0, sec: Math.round(S.elapsed / 1000) });
      if (window.Games) window.Games.sync();
      battleEnd(true, 'clear', delay, fresh);
      return;
    }
    let extra = '', starsHtml = '', stars = 0, fanfare = false;
    if (r.mode === 'level') {
      // 여정: 별을 매기고 적는다 (journey.js)
      const J = window.Journey;
      const got = J.starsFor(r.level, { mistakes: S.mistakes, hintsUsed: S.hintsUsed, elapsed: S.elapsed });
      const res = J.record(r.level, got);
      starsHtml = [1, 2, 3].map((k) => `<i class="${k <= got ? 'on' : ''}" style="--k:${k}">★</i>`).join('');
      stars = got;
      const m = J.mission(r.level);
      if (m) extra += '<br>' + T('win.mission', { t: J.missionText(m), r: T(J.missionMet(m, { mistakes: S.mistakes, hintsUsed: S.hintsUsed, elapsed: S.elapsed }) ? 'win.mission.ok' : 'win.mission.no') });
      if (res.better) extra += '<br>' + T('win.better', { n: res.best });
      else if (!res.firstClear && got < res.best) extra += '<br>' + T('win.best', { n: res.best });
      if (res.bonus) { extra += '<br>' + T('journey.reward', { n: J.chapterOf(r.level), h: res.bonus }); fanfare = true; }
    } else if (r.mode === 'daily' && !St.d.daily.includes(r.date)) {
      St.d.daily.push(r.date);
      St.d.hints++;
      extra = '<br>' + T('win.dailyGift');
    } else if (r.seed !== undefined) {
      const lv = St.levelOf(St.sizeStat(n).won), stars = St.starsOf(St.sizeStat(n).won);
      extra = '<br>' + T('win.sizeLv', { n, lv, s: stars, t: St.STARS_PER_LEVEL }) +
        '<br>' + T('win.code', { c: `<span class="code-chip">${St.codeOf(n, r.seed)}</span>` });
    }
    St.save();
    // 업적(achievements.js) — 기록을 다 적은 뒤에 센다. 새로 딴 것은 결과 창에 한 줄씩
    const fresh = window.Achievements ? window.Achievements.noteWin({ hintsUsed: S.hintsUsed }) : [];
    extra += achLines(fresh);
    if (passGot) extra += window.Pass.winLine(passGot);
    if (window.Track) window.Track('game_won', { mode: r.mode, n, level: r.level || 0, mistakes: S.mistakes, hints: S.hintsUsed, sec: Math.round(S.elapsed / 1000) });
    if (window.Games) window.Games.sync();   // 순위표(여정 별)·업적·클라우드 저장

    // 결과 창을 떠나는 버튼은 다 afterAd — 깬 판이 셋 쌓였으면 전면 광고(ads.js)
    const home = { label: T('act.home'), kind: 'ghost', fn: () => afterAd(exit) };
    let actions;
    if (r.mode === 'level') {
      // 다음 단계: 지금 차례까지만 열려 있다 (예전 단계를 다시 한 뒤면 다음 칸, 없으면 지금 차례)
      const next = Math.min(r.level + 1, St.d.level);
      actions = [{ label: T('act.next', { n: next }), fn: () => afterAd(() => start({ mode: 'level', level: next })) },
        { label: T('act.map'), kind: 'ghost', fn: () => afterAd(() => exit(true)) }];
    }
    else if (r.mode === 'daily') actions = [{ label: T('act.home'), fn: () => afterAd(exit) }];
    else actions = [{ label: T('act.more'), fn: () => afterAd(() => start({ mode: r.mode, n, seed: newSeed() })) }, home];
    // 친구 초대(invite.js): 같은 판을 토스 링크로. 여정 단계는 코드가 없어 빼고
    if (r.mode !== 'level' && window.Invite && window.Invite.available) {
      const won = { t: St.fmtTime(S.elapsed), m: S.mistakes };
      actions.splice(1, 0, { label: T('share.btn'), kind: 'ghost', fn: () => window.Invite.send(n, seedOf(r), won, 'won') });
    }

    setTimeout(() => {
      sfx('win'); buzz(30);
      // 별은 창에 뜨는 차례에 맞춰 하나씩 반짝이고, 장을 끝냈으면 팡파르로 마무리
      for (let k = 0; k < stars; k++) sfx('star', 560 + k * 230, k);
      if (r.mode !== 'level') sfx('stamp', 700);   // '참 잘했어요' 도장
      if (fanfare) sfx('level', 620 + stars * 230);
      showModal({
        stamp: r.mode !== 'level',
        mascot: 'joy',
        stars: starsHtml,
        title: r.mode === 'daily' ? T('win.daily', { d: titleOf(r) }) : r.mode === 'level' ? T('win.stage', { n: r.level }) : T('win.free'),
        body: `<span class="num-line">${T('win.body', { t: St.fmtTime(S.elapsed), m: S.mistakes })}${r.mode === 'level' ? T('win.hints', { h: S.hintsUsed }) : ''}</span>${extra}`,
        actions,
      });
    }, delay + 450);
  }

  function showLose() {
    sfx('lose');
    showModal({
      title: T('lose.title'),
      mascot: 'sad',
      body: T('lose.body') + (ads() ? '' : T('lose.web')),
      actions: [
        { label: T('act.adContinue'), fn: () => void continueByAd() },
        { label: T('act.restart'), kind: 'ghost', fn: restart },
        { label: T('act.home'), kind: 'ghost', fn: exit },
      ],
    });
  }

  function restart() {
    delete St.d.boards[S.run.mode];
    start(S.run);
  }

  function newSeed() { return (Math.random() * 4294967296) >>> 0; }

  // ── 광고 ──────────────────────────────────────────────
  // 앱(안드로이드)에서만 진짜 광고가 뜬다. 웹에서는 바로 보상을 준다.
  const ads = () => !!(window.Ads && window.Ads.isNative);

  // 광고 한 편에 힌트 2개(2026-10-16) — 하나는 바로 쓰고 하나는 남는다
  const HINTS_PER_AD = 2;
  async function giveHintByAd() {
    if (ads()) {
      toast(T('ad.hint', { n: HINTS_PER_AD }));
      const got = await window.Ads.rewarded();
      if (got === null) { toast(T('ad.noFill')); return; }
      if (!got) { toast(T('ad.hintFail')); return; }
    } else {
      toast(T('ad.hintWeb'));
    }
    St.d.hints += HINTS_PER_AD;
    St.save();
    paintHintBadge();
    useHint();
    toast(T('ad.hintGot', { n: HINTS_PER_AD, left: St.d.hints }));
  }

  async function continueByAd() {
    if (ads()) {
      const got = await window.Ads.rewarded();
      if (got === null) { toast(T('ad.noFill')); return; }
      if (!got) { toast(T('ad.contFail')); return; }
    }
    hideModal();
    S.hearts = 1; S.over = false;
    S.continued = true;   // 이어 한 판은 상대 기록으로 안 쓴다(대결에는 이어하기가 없다)
    paintHearts(); persist();
  }

  // ── 대결 (battle.js 가 판을 열고 결과를 적는다) ─────────────
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  // 결과 창에 새로 단 업적은 두 줄까지 — 더 있으면 "외 n개" (나머지는 수상 화면에)
  function achLines(ids) {
    const A = window.Achievements;
    ids = ids || [];
    const line = (id) => `<br><span class="ach-line"><img src="${A.src(id)}" alt="">${esc(T('ach.unlocked', { n: A.name(id) }))}</span>`;
    return ids.slice(0, 2).map(line).join('') + (ids.length > 2 ? `<br><span class="ach-more">${esc(T('ach.more', { n: ids.length - 2 }))}</span>` : '');
  }

  let tickTimer = 0;
  function battleIntro(run) {
    const g = run.ghost;
    $('bbMe').textContent = run.me;
    $('bbOpp').textContent = g.name;
    $('vsMe').textContent = run.me;
    $('vsMeLv').textContent = T('battle.lv', { n: St.d.level });
    $('vsOpp').textContent = g.name;
    $('vsOppLv').textContent = T('battle.lv', { n: g.lv });
    paintBattle();
    $('vsIntro').hidden = false;
    sfx('open');
    setTimeout(() => {
      $('vsIntro').hidden = true;
      if (!S.battle || S.over) return;
      S.t0 = performance.now(); S.running = true;
      clearInterval(tickTimer);
      tickTimer = setInterval(tick, 200);
    }, 2400);
  }
  function paintBattle() {
    if (!S.battle) return;
    const N = S.p.n * S.p.n;
    const mine = S.state.reduce((a, v) => a + (v !== 0 ? 1 : 0), 0);
    const o = window.Battle.ghostAt(S.battle.ghost, elapsed());
    $('bbMeFill').style.width = `${(mine / N) * 100}%`;
    $('bbOppFill').style.width = `${(Math.min(o.filled, N) / N) * 100}%`;
    $('bbOppX').textContent = '✕'.repeat(o.bad);
    return o;
  }
  function tick() {
    if (!S.battle || S.over) { clearInterval(tickTimer); return; }
    if (!S.running) return;
    const o = paintBattle();
    if (o.out && !S.battle.outTold) { S.battle.outTold = true; toast(T('battle.oppOut')); }
    if (o.done) { S.over = true; S.running = false; battleEnd(false, 'ghost'); }
  }
  /** 대결 판 끝. why: clear | ghost | mistakes | quit */
  function battleEnd(won, why, delay, freshAch) {
    clearInterval(tickTimer);
    if (S.running) { S.elapsed += performance.now() - S.t0; S.running = false; }
    const B = S.battle;
    const res = window.Battle.finish(won, B.tier, why);
    if (why === 'quit') return;
    const again = () => afterAd(() => { hideModal(); exit(); window.Battle.start(B.tier); });
    const reason = won ? '' : why === 'ghost' ? T('battle.lostGhost', { n: esc(B.ghost.name) }) : T('battle.lostMistakes');
    setTimeout(() => {
      sfx(won ? 'win' : 'lose'); buzz(30);
      showModal({
        mascot: won ? 'joy' : 'sad',
        title: T(won ? 'battle.won' : 'battle.lost'),
        body: (won ? `<span class="num-line">${T('win.body', { t: St.fmtTime(S.elapsed), m: S.mistakes })}</span>` : reason) +
          `<br><span class="season-line"><img src="${res.emblem}" alt="">${esc(res.season)}</span>` +
          `<br>${esc(res.record)}` + achLines(freshAch),
        actions: [
          ...(res.again ? [{ label: T('battle.again'), fn: again }] : []),
          { label: T('act.home'), kind: res.again ? 'ghost' : undefined, fn: () => afterAd(() => exit()) },
        ],
      });
    }, (delay || 0) + (won ? 450 : 650));
  }
  // 대결 중에 나가려 하면 묻는다 — 나가면 진 것으로 친다
  function askQuit() {
    pause();
    S.battle.asking = true;
    showModal({
      title: T('battle.quitTitle'),
      body: T('battle.quitBody'),
      actions: [
        { label: T('battle.keep'), fn: () => { S.battle.asking = false; hideModal(); resume(); } },
        { label: T('battle.quit'), kind: 'ghost', fn: () => { S.battle.asking = false; S.over = true; battleEnd(false, 'quit'); hideModal(); exit(); } },
      ],
    });
  }

  // 판을 깬 뒤 다음 판으로 갈 때 (몇 판에 한 번 전면 광고)
  function afterAd(go) {
    if (!ads()) { go(); return; }
    hideModal();
    window.Ads.maybeInterstitial().then(go, go);
  }

  // 광고가 화면을 덮는 동안 판 시간을 멈춘다 (ads.js 가 부른다)
  function pause() {
    if (S.running) { S.elapsed += performance.now() - S.t0; S.running = false; }
  }
  function resume() {
    if (!S.over && S.run && !$('game').hidden && !S.running) { S.t0 = performance.now(); S.running = true; }
  }

  // ── 창·알림 ──────────────────────────────────────────
  function showModal(o) {
    $('mStamp').hidden = !o.stamp;
    // 지우개 캐릭터: 다 풀면 좋아서 뛰고, 하트를 다 쓰면 지쳐 앉아 있다
    $('mMascot').hidden = !o.mascot;
    $('mDialog').classList.toggle('has-mascot', !!o.mascot);
    // 좋아서 뛰기는 움직이는 그림(스프라이트), 지친 모습은 멈춘 그림
    if (o.mascot) $('mMascotArt').className = o.mascot === 'joy' ? 'sprite sprite-cheer' : 'mascot-sad';
    $('mStars').hidden = !o.stars;
    $('mStars').innerHTML = o.stars || '';
    $('mTitle').textContent = o.title;
    $('mBody').innerHTML = o.body || '';
    const box = $('mActions');
    box.textContent = '';
    o.actions.forEach((a) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `btn ${a.kind === 'ghost' ? 'btn-ghost' : 'btn-primary'}`;
      b.textContent = a.label;
      b.addEventListener('click', a.fn);
      box.appendChild(b);
    });
    $('modal').hidden = false;
    box.firstChild.focus({ preventScroll: true });
  }
  function hideModal() { $('modal').hidden = true; }

  let toastTimer = 0;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2200);
  }

  function openSheet() {
    St.paintToggles();
    // 새 게임·하트 없이 판은 도전 코드로 친구에게 같은 판을 보낼 수 있다
    // 대결 판은 처음부터 다시(하트 되돌리기)·코드(상대 판 미리 보기)를 막는다
    const hasCode = S.run && S.run.seed !== undefined && !inBattle();
    $('bRestart').hidden = inBattle();
    $('codeRow').hidden = !hasCode;
    $('shareRow').hidden = !(hasCode && window.Invite && window.Invite.available);
    if (hasCode) $('codeText').textContent = St.codeOf(S.p.n, S.run.seed);
    $('sheet').hidden = false;
    sfx('open');
  }
  function closeSheet() {
    const was = !$('sheet').hidden;
    $('sheet').hidden = true;
    if (was) sfx('close');
  }

  // ── 입력 ─────────────────────────────────────────────
  // 누르면 그 칸, 누른 채 끌면 지나가는 칸마다 같은 도구로. 틀리면 거기서 멈춘다.
  let drag = null;
  function cellIndexAt(x, y) {
    const el = document.elementFromPoint(x, y);
    const cell = el && el.closest && el.closest('.cell');
    return cell && board.contains(cell) ? +cell.dataset.i : -1;
  }
  board.addEventListener('pointerdown', (e) => {
    const clue = e.target.closest('.clue');
    if (clue) { showBubble(+clue.dataset.li); return; }
    const cell = e.target.closest('.cell');
    if (!cell || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const i = +cell.dataset.i;
    const ok = act(i);
    drag = ok ? { id: e.pointerId, last: i } : null;
  });
  board.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const i = cellIndexAt(e.clientX, e.clientY);
    if (i < 0 || i === drag.last) return;
    drag.last = i;
    if (!act(i)) drag = null;
  });
  const endDrag = (e) => { if (drag && e.pointerId === drag.id) drag = null; };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  // 키보드(Enter/Space)로 누른 칸. 포인터가 만든 click 은 detail > 0 이라 건너뜀.
  board.addEventListener('click', (e) => {
    if (e.detail !== 0) return;
    const clue = e.target.closest('.clue');
    if (clue) { showBubble(+clue.dataset.li); return; }
    const cell = e.target.closest('.cell');
    if (cell) act(+cell.dataset.i);
  });

  // ── 합 말풍선: 합 숫자를 누르면 그 줄에 남길 합과 지금 동그라미 친 합 ──
  const bubble = $('bubble');
  let bubbleTimer = 0, bubbleLine = -1;
  // 숫자 끝소리에 맞는 조사: 2(이)·4(사)·5(오)·9(구)로 끝나면 '가', 나머지는 받침이 있어 '이'
  const josa = (v) => ([2, 4, 5, 9].includes(v % 10) ? '가' : '이');
  function showBubble(li) {
    const L = S.lines && S.lines[li], el = clueEls[li];
    if (!L || !el) return;
    if (window.Tutorial) window.Tutorial.clued(li);
    hideBubble();
    let sum = 0, left = 0;
    for (const c of L.cells) {
      if (S.state[c] === 1) sum += S.p.nums[c];
      else if (S.state[c] === 0) left++;
    }
    const what = T(L.kind === 'r' ? 'bub.row' : L.kind === 'c' ? 'bub.col' : 'bub.region');
    bubble.innerHTML = L.done
      ? T('bub.done', { w: what })
      : T('bub.need', { w: what, t: L.target, j: josa(L.target) }) + T('bub.sub', { s: sum, n: left });
    bubble.hidden = false;
    const r = el.getBoundingClientRect(), w = bubble.offsetWidth, h = bubble.offsetHeight;
    const vw = document.documentElement.clientWidth;
    const x = Math.max(12, Math.min(vw - w - 12, r.left + r.width / 2 - w / 2));
    let below = L.kind === 'c'; // 위쪽 합은 아래로, 옆 합은 위로 편다
    let y = below ? r.bottom + 10 : r.top - h - 10;
    if (!below && y < 8) { below = true; y = r.bottom + 10; }
    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;
    bubble.style.setProperty('--ax', `${r.left + r.width / 2 - x}px`);
    bubble.classList.toggle('below', below);
    L.cells.forEach((c) => cellEls[c].classList.add('lit'));
    bubbleLine = li;
    bubbleTimer = setTimeout(hideBubble, 3500);
  }
  function hideBubble() {
    clearTimeout(bubbleTimer);
    bubble.hidden = true;
    if (bubbleLine >= 0 && S.lines[bubbleLine]) S.lines[bubbleLine].cells.forEach((c) => cellEls[c] && cellEls[c].classList.remove('lit'));
    bubbleLine = -1;
  }
  // 합 숫자가 아닌 곳을 누르면 닫는다
  document.addEventListener('pointerdown', (e) => {
    if (!bubble.hidden && !e.target.closest('.clue')) hideBubble();
  }, true);

  const pickTool = (tool) => {
    S.tool = tool; paintTool(); sfx('tool');
    if (window.Tutorial) window.Tutorial.toolChanged(tool);
  };
  $('modeErase').addEventListener('click', () => pickTool('erase'));
  $('modeKeep').addEventListener('click', () => pickTool('keep'));
  $('btnHint').addEventListener('click', useHint);
  $('btnBack').addEventListener('click', () => exit(true));
  $('btnSettings').addEventListener('click', openSheet);
  $('sheetClose').addEventListener('click', closeSheet);
  $('sheet').addEventListener('click', (e) => { if (e.target === $('sheet')) closeSheet(); });
  St.mountToggles($('sheetToggles'));
  St.onToggle((key, on) => {
    // 자동 지우기를 켜는 순간 이미 조건이 된 줄은 바로 정리
    if (key === 'autoErase' && on && S.run && !S.over && !$('game').hidden) settle(false);
    if (key === 'vibe' && on) buzz(20);
  });
  $('bRestart').addEventListener('click', restart);
  $('shareRow').addEventListener('click', () => { closeSheet(); window.Invite.send(S.p.n, seedOf(S.run), null, 'sheet'); });
  $('codeRow').addEventListener('click', () => {
    const code = $('codeText').textContent;
    const done = () => toast(T('toast.code', { c: code }));
    try {
      navigator.clipboard.writeText(code).then(done, () => toast(T('toast.codeShow', { c: code })));
    } catch (e) { toast(T('toast.codeShow', { c: code })); }
  });
  const jump = (dl) => {
    const lv = Math.max(1, S.run.level + dl);
    St.d.level = lv; St.save();
    start({ mode: 'level', level: lv });
    toast(T('toast.jump', { n: lv, s: S.p.n }));
  };
  $('lvPrev').addEventListener('click', () => jump(-1));
  $('lvNext').addEventListener('click', () => jump(1));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('sheet').hidden) closeSheet();
  });

  // 가려진 동안은 시간을 세지 않는다
  document.addEventListener('visibilitychange', () => {
    if ($('game').hidden) return;
    if (document.hidden) {
      if (S.running) { S.elapsed += performance.now() - S.t0; S.running = false; }
      persist();
    } else if (!S.over && $('vsIntro').hidden && !(S.battle && S.battle.asking)) {
      S.t0 = performance.now(); S.running = true;
    }
  });

  if (window.ResizeObserver) new ResizeObserver(layout).observe(wrap);
  else window.addEventListener('resize', layout);

  // 뒤로가기: 판 쪽에서 맨 위에 있는 것 하나만 닫는다(back.js 가 부른다). 닫았으면 true.
  function closeTop() {
    if (!bubble.hidden) { hideBubble(); return true; }
    if (!$('sheet').hidden) { closeSheet(); return true; }
    // 대결 그만둘까 물음이 떠 있으면 '계속하기'
    if (S.battle && S.battle.asking) { S.battle.asking = false; hideModal(); resume(); return true; }
    // 결과 창에서는 창만 닫으면 갈 데가 없다 — 홈(여정이면 지도)으로 보낸다
    if (!$('modal').hidden) { exit(true); return true; }
    if (!$('game').hidden) { exit(true); return true; }
    return false;
  }

  const playing = () => !!S.run && !S.over && !$('game').hidden;
  // 창은 홈 쪽(back.js 의 나가기 물음)에서도 쓴다 — 화면 위에 덮는 물음창은 이것 하나뿐이다
  const Game = { start, exit, newSeed, titleOf, toast, pause, resume, playing, closeTop, modal: showModal, hideModal, onExit: null };
  window.Game = Game;
})();
