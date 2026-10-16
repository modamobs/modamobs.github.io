/* 지우개 셈 — 홈과 아래 탭 (클래식 스도쿠 홈을 따라 만듦)
 *
 * 홈: 위에 배지 둘(푼 판·힌트), 넓은 데일리 카드, 반쪽 카드 둘(레벨·하트 없이),
 *     가운데 게임 이름, 아래 이어하기·새 게임. 한 화면에 다 보인다.
 * 탭: 홈 · 데일리 · (대결 — 토스에서만, battle.js) · 통계 · 설정. 통계 탭 위 「수상」 카드 → awards.js
 */
(function () {
  'use strict';
  const St = window.Store, G = window.Game, CS = window.CrossSum, J = window.Journey;
  const $ = (id) => document.getElementById(id);
  const sfx = (n, at, i) => { if (window.Sfx) window.Sfx(n, at, i); };
  const d = St.d;

  // 달마다 바뀌는 데일리 카드 색 (스도쿠 season 과 같은 값)
  const SEASON = ['#dbe8ff', '#ffe0ec', '#e3f5d6', '#ffe4f1', '#dcfce7', '#d9f3ff', '#d6f3f2', '#fff1cc', '#ffe3cc', '#ffdcc9', '#ece6dc', '#e0ecff'];
  const SEASON_B = ['#3b82f6', '#ec4899', '#65a30d', '#f472b6', '#22c55e', '#0ea5e9', '#14b8a6', '#f59e0b', '#f97316', '#ea580c', '#a16207', '#2563eb'];

  let tab = 'home';

  // ── 홈 ──
  function renderHome() {
    const today = St.dateKey();
    const { m, d: day } = St.parseKey(today);
    document.documentElement.style.setProperty('--season-a', SEASON[m - 1]);
    document.documentElement.style.setProperty('--season-b', SEASON_B[m - 1]);

    $('bHints').textContent = d.hints;
    if (window.Pass) window.Pass.paintBand();

    // 오늘 할 일 카드: 데일리 날짜·크기·연속, 이번 달 트로피, 이어하기 / 새 게임 · 데일리
    const done = St.dailyDone(today);
    const dailySlot = d.boards.daily && d.boards.daily.date === today;
    const streak = St.streak();
    const free = d.boards.free;
    const firstTime = d.stats.solved === 0 && !Object.keys(d.boards).length;
    $('heroKicker').textContent = T('home.hero.kicker', { d: window.I18n.fmtDate(St.parseKey(today).y, m, day), n: St.dailySize(today) });
    $('heroTitle').textContent = T(firstTime ? 'home.hero.first' : done ? 'home.hero.done' : 'home.hero.title');
    $('heroStreak').hidden = streak === 0;
    $('heroStreakN').textContent = T('home.daily.streak', { n: streak });
    const pad = String(m).padStart(2, '0');
    const days = d.daily.filter((k) => k.startsWith(today.slice(0, 8))).length;
    const total = new Date(St.parseKey(today).y, m, 0).getDate();
    const tier = days >= total ? 'gold' : days >= 20 ? 'silver' : days >= 10 ? 'bronze' : 'locked';
    $('heroTrophy').src = `awards/months/m${pad}.webp`;
    $('heroTrophy').className = 'home-hero-trophy ' + tier;
    $('hContinue').hidden = !free || firstTime;
    if (free) $('hContinueSub').textContent = `${St.fmtTime(free.elapsed || 0)} · ${free.n}×${free.n}`;
    $('hNew').textContent = T(firstTime ? 'home.new.first' : 'home.new');
    $('hNew').className = 'btn ' + (free && !firstTime ? 'btn-secondary' : 'btn-primary');
    $('hPick').hidden = !firstTime;
    $('dPlay').hidden = firstTime;
    $('dPlay').textContent = T(done ? 'home.dailyView' : dailySlot ? 'home.dailyResume' : 'home.dailyPlay');

    // 줄 목록: 여정 · 하트 없이
    const lv = d.level;
    $('lSub').textContent = T('home.journey.sub', { c: J.chapterOf(lv), n: lv, s: J.totalStars() });
    $('rSub').textContent = d.boards.relaxed ? T('home.relax.subResume') : T('home.relax.sub');
  }

  // ── 데일리 탭: 달력 ──
  let calMonth = null; // {y, m}
  let calPick = null;
  function renderDaily() {
    const today = St.dateKey();
    const t = St.parseKey(today);
    if (!calMonth) calMonth = { y: t.y, m: t.m };
    if (!calPick) calPick = today;
    const { y, m } = calMonth;
    $('calTitle').textContent = window.I18n.fmtMonth(y, m);
    $('calNext').disabled = y === t.y && m === t.m;
    const first = new Date(y, m - 1, 1).getDay();
    const days = new Date(y, m, 0).getDate();
    let html = '';
    for (let k = 0; k < first; k++) html += '<span class="cal-day blank"></span>';
    for (let day = 1; day <= days; day++) {
      const key = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const future = key > today;
      const cls = ['cal-day'];
      if (St.dailyDone(key)) cls.push('done');
      if (key === today) cls.push('today');
      if (key === calPick) cls.push('pick');
      html += `<button type="button" class="${cls.join(' ')}" data-day="${key}" ${future ? 'disabled' : ''}><span>${day}</span>${future ? '' : RING}</button>`;
    }
    $('calGrid').innerHTML = html;
    const doneThisMonth = d.daily.filter((k) => k.startsWith(`${y}-${String(m).padStart(2, '0')}`)).length;
    $('calCount').textContent = T('daily.count', { n: doneThisMonth, s: St.streak() });
    const p = St.parseKey(calPick);
    const n = St.dailySize(calPick);
    const done = St.dailyDone(calPick);
    $('calPlay').textContent = T(done ? 'daily.replay' : 'daily.play', { d: window.I18n.fmtDate(p.y, p.m, p.d), n });
  }
  const RING = '<svg class="ring" viewBox="0 0 100 100" aria-hidden="true"><path pathLength="1" d="M72 20C54 8 24 12 14 36C5 58 22 86 50 87C76 88 92 66 87 44C83 27 68 16 50 15"/></svg>';

  // ── 통계 탭 ──
  function renderStats() {
    const s = d.stats;
    const A = window.Achievements;
    if (A) {
      A.markSeen();
      const list = A.list();
      $('awardsSum').textContent = T('awards.sum', { d: list.filter((a) => a.done).length, t: list.length });
    }
    paintDots();
    $('sSolved').textContent = s.solved;
    $('sPerfect').textContent = s.perfect;
    $('sLevel').textContent = d.level - 1;
    $('sStreak').textContent = St.streak();
    let rows = '';
    for (let n = 5; n <= 9; n++) {
      rows += `<li><span>${n}×${n}</span><b>${s.best[n] ? St.fmtTime(s.best[n]) : '—'}</b></li>`;
    }
    $('sBest').innerHTML = rows;
  }

  // 아직 수상 화면에서 안 본 업적이 있으면 통계 탭과 수상 카드에 점
  function paintDots() {
    const on = !!(window.Achievements && window.Achievements.unseen());
    $('tb-stats').classList.toggle('dot', on);
    $('statsAwards').classList.toggle('dot', on);
  }

  // ── 탭 전환 ──
  const TABS = ['home', 'daily', 'battle', 'stats', 'settings'];
  function show(next) {
    if (next === 'battle' && $('tb-battle').hidden) next = 'home';   // 대결은 토스에서만
    tab = next;
    TABS.forEach((t) => {
      $(`tab-${t}`).hidden = t !== tab;
      $(`tb-${t}`).classList.toggle('on', t === tab);
      $(`tb-${t}`).setAttribute('aria-current', t === tab ? 'page' : 'false');
    });
    if (tab === 'home') renderHome();
    if (tab === 'daily') renderDaily();
    if (tab === 'battle' && window.Battle) window.Battle.render();
    if (tab === 'stats') renderStats();
    if (tab !== 'stats') paintDots();
    if (tab === 'settings') $('setLevel').textContent = T('home.journey.stage', { n: d.level });
    $('homePage').scrollTop = 0;
  }

  // ── 새 게임 창 — 스도쿠 새 게임 창처럼 크기마다 한 줄: 이름 · Lv · 추천 / ★ 진행 막대 ──
  // 별은 크기마다 따로 쌓인다(이긴 판 하나 = 별 하나, 20개마다 Lv+1). 모든 줄에 막대를 보여
  // "저걸 다 채워야 다른 크기를 하나" 로 읽히지 않게 한다(스도쿠에서 겪은 것).
  const NAMES = (n) => T('new.size.' + n);
  const STAR = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 17.3l-5.9 3.2 1.3-6.5L2.5 9.4l6.6-.8z"/></svg>';
  function openNew() {
    const rec = St.recommendSize(), fav = St.favSize();
    $('newList').innerHTML = St.SIZES.map((n) => {
      const won = St.sizeStat(n).won, stars = St.starsOf(won);
      return `<button type="button" class="diff-row" data-n="${n}">` +
        `<span class="diff-name">${NAMES(n)}</span><span class="diff-size">${n}×${n}</span>` +
        `<span class="diff-lv${n === fav && won > 0 ? ' strong' : ''}">Lv${St.levelOf(won)}</span>` +
        (n === rec ? `<span class="diff-rec">${T('new.rec')}</span>` : '') +
        `<span class="diff-progress${won === 0 ? ' dim' : ''}">` +
        `<span class="diff-stars">${STAR} ${stars}/${St.STARS_PER_LEVEL}</span>` +
        `<span class="bar"><span class="bar-fill" style="width:${(stars / St.STARS_PER_LEVEL) * 100}%"></span></span>` +
        '</span></button>';
    }).join('');
    $('codeInput').value = '';
    $('codeGo').disabled = true;
    $('codeBad').hidden = true;
    $('newSheet').hidden = false;
    sfx('open');
  }
  $('newList').addEventListener('click', (e) => {
    const b = e.target.closest('[data-n]');
    if (!b) return;
    $('newSheet').hidden = true;
    G.start({ mode: 'free', n: +b.dataset.n, seed: G.newSeed() });
  });
  $('newSheet').addEventListener('click', (e) => { if (e.target === $('newSheet')) { $('newSheet').hidden = true; sfx('close'); } });
  // 도전 코드
  $('codeInput').addEventListener('input', () => {
    $('codeGo').disabled = !$('codeInput').value.trim();
    $('codeBad').hidden = true;
    $('codeInput').classList.remove('bad');
  });
  $('codeForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const c = St.parseCode($('codeInput').value);
    if (!c) { $('codeBad').hidden = false; $('codeInput').classList.add('bad'); return; }
    $('newSheet').hidden = true;
    G.start({ mode: 'free', n: c.n, seed: c.seed });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { $('newSheet').hidden = true; $('howSheet').hidden = true; }
  });

  // ── 버튼 ──
  const playDaily = (key) => G.start({ mode: 'daily', date: key });
  $('dPlay').addEventListener('click', () => {
    const today = St.dateKey();
    if (St.dailyDone(today)) show('daily');
    else playDaily(today);
  });
  // 여정 카드 → 지도. 지도에서 단계를 누르면 그 판, 뒤로 가면 홈.
  const openMap = () => { sfx('open'); J.open((stage) => G.start({ mode: 'level', level: stage })); };
  $('lGo').addEventListener('click', openMap);
  J.onClose = () => show('home');
  // 하트 없이 줄 → 쉬움(5×5)·어려움(7×7), 하던 판이 있으면 이어하기가 먼저
  $('rGo').addEventListener('click', () => {
    sfx('open');
    const r = d.boards.relaxed;
    const go = (fn) => () => { G.hideModal(); fn(); };
    G.modal({
      title: T('home.relax'),
      body: T('home.relax.pick'),
      actions: [
        ...(r ? [{ label: T('home.continue'), fn: go(() => G.start({ mode: 'relaxed', n: r.n, seed: r.seed })) }] : []),
        { label: T('home.relax.easy') + ' · 5×5', kind: r ? 'ghost' : undefined, fn: go(() => G.start({ mode: 'relaxed', n: 5, seed: G.newSeed() })) },
        { label: T('home.relax.hard') + ' · 7×7', kind: 'ghost', fn: go(() => G.start({ mode: 'relaxed', n: 7, seed: G.newSeed() })) },
        { label: T('home.close'), kind: 'ghost', fn: () => { G.hideModal(); sfx('close'); } },
      ],
    });
  });
  $('hContinue').addEventListener('click', () => {
    const f = d.boards.free;
    if (f) G.start({ mode: 'free', n: f.n, seed: f.seed });
  });
  $('hNew').addEventListener('click', () => {
    // 처음 온 사람은 고르지 않고 레벨 1로 — 스도쿠에서 두 단계가 길어 나가는 사람이 많았다
    if (!$('hPick').hidden) G.start({ mode: 'level', level: d.level });
    else openNew('free');
  });
  $('hPick').addEventListener('click', () => openNew('free'));

  $('calPrev').addEventListener('click', () => {
    calMonth.m--; if (calMonth.m < 1) { calMonth.m = 12; calMonth.y--; }
    renderDaily();
  });
  $('calNext').addEventListener('click', () => {
    calMonth.m++; if (calMonth.m > 12) { calMonth.m = 1; calMonth.y++; }
    renderDaily();
  });
  $('calGrid').addEventListener('click', (e) => {
    const b = e.target.closest('[data-day]');
    if (!b || b.disabled) return;
    calPick = b.dataset.day;
    renderDaily();
  });
  $('calPlay').addEventListener('click', () => playDaily(calPick));

  // 달력 요일 줄과 언어 고르는 칸은 말이 바뀌면 다시 그린다
  function paintWeek() {
    $('calWeek').innerHTML = T('daily.week').split(',').map((w) => `<span>${w}</span>`).join('');
  }
  function paintLangPick() {
    const NAMES = { auto: T('set.lang.auto'), ko: '한국어', en: 'English', ja: '日本語', zh: '中文' };
    const sel = $('setLang');
    sel.innerHTML = ['auto', ...window.I18n.codes].map((c) => `<option value="${c}">${NAMES[c]}</option>`).join('');
    sel.value = d.lang || 'auto';
  }
  // 화면 밝게·어둡게 — 고르면 바로 바뀌고 저장(다음에 켤 때는 index.html 머리에서 먼저 붙인다)
  function paintTheme() {
    const th = d.theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = th;
    document.querySelectorAll('[data-theme-pick]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.themePick === th)));
  }
  $('setTheme').addEventListener('click', (e) => {
    const b = e.target.closest('[data-theme-pick]');
    if (!b || b.dataset.themePick === d.theme) return;
    d.theme = b.dataset.themePick;
    St.save();
    sfx('tap');
    paintTheme();
    if (window.Track) window.Track('theme', { t: d.theme });
  });
  paintTheme();
  $('setLang').addEventListener('change', (e) => {
    window.I18n.setLang(e.target.value);
    sfx('tap');
  });

  /** 말을 바꿨을 때 — 지금 보고 있는 화면을 새 말로 다시 그린다 (i18n.js 가 부른다) */
  function repaint() {
    St.paintToggles();
    St.mountToggles($('setToggles'));
    St.mountToggles($('sheetToggles'));
    paintWeek();
    paintLangPick();
    show(tab);
  }

  document.querySelectorAll('.tabbar .tab').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.tab !== tab) sfx('tap');
    show(b.dataset.tab);
  }));

  St.mountToggles($('setToggles'));
  $('setHow').addEventListener('click', () => { $('howSheet').hidden = false; sfx('open'); });
  $('howClose').addEventListener('click', () => { $('howSheet').hidden = true; sfx('close'); });
  $('howAgain').addEventListener('click', () => {
    if (window.Tutorial) window.Tutorial.replay();
    $('howSheet').hidden = true;
    sfx('close');
    G.toast(T('how.again.toast'));
  });
  $('howSheet').addEventListener('click', (e) => { if (e.target === $('howSheet')) { $('howSheet').hidden = true; sfx('close'); } });
  // 앱 버전(build.mjs 가 build.gradle 의 versionName 을 window.APP 에 넣는다)과,
  // 개발판에서만 보이는 단계 옮기기 — 빌드할 때 --dev 를 주거나 주소에 ?dev=1 을 붙이면 켜진다.
  const APP = window.APP || {};
  $('appVer').textContent = APP.version ? 'v' + APP.version : '';
  const dev = !!APP.dev || new URLSearchParams(location.search).get('dev') === '1';
  $('setMove').hidden = !dev;
  const move = (dl) => {
    d.level = Math.max(1, d.level + dl);
    delete d.boards.level;
    St.save();
    $('setLevel').textContent = T('home.journey.stage', { n: d.level });
  };
  $('setPrev').addEventListener('click', () => move(-1));
  $('setNext').addEventListener('click', () => move(1));

  // 판에서 나오면: 여정 단계였으면 지도, 아니면 보던 탭
  G.onExit = (o) => { show(tab); if (o && o.map) openMap(); };

  // 뒤로가기: 홈 쪽에서 맨 위에 있는 것 하나만 닫는다(back.js 가 부른다)
  function closeTop() {
    if (!$('howSheet').hidden) { $('howSheet').hidden = true; return true; }
    if (!$('newSheet').hidden) { $('newSheet').hidden = true; return true; }
    if (tab !== 'home') { show('home'); return true; }   // 다른 탭이면 먼저 홈 탭으로
    return false;
  }
  $('statsAwards').addEventListener('click', () => { if (window.Awards) window.Awards.open('ach'); });
  window.Home = { closeTop, show, repaint, paintDots };

  // 홈 캐릭터: 손 흔들기와 생각하기를 번갈아 돈다.
  // 한 동작만 끝없이 돌면 인형처럼 보인다 — 몇 바퀴 돌고 다음 동작으로 넘어간다.
  const hero = document.querySelector('.home-title .sprite');
  if (hero) {
    const MOVES = [{ cls: 'sprite-wave', ms: 1500 * 3 }, { cls: 'sprite-think', ms: 2400 * 2 }];
    let at = 0;
    const turn = () => {
      at = (at + 1) % MOVES.length;
      hero.className = 'sprite ' + MOVES[at].cls;   // 클래스를 갈면 애니메이션도 처음부터
      setTimeout(turn, MOVES[at].ms);
    };
    setTimeout(turn, MOVES[0].ms);
  }

  // 시작 화면은 다 접히면 치운다(그대로 두면 보이지 않는 채로 화면을 덮는다)
  const brand = $('brand');
  // 안쪽 그림의 애니메이션도 여기까지 올라온다 — once 를 쓰면 그걸로 리스너가 떨어져 나간다
  if (brand) brand.addEventListener('animationend', function off(e) {
    if (e.target !== brand) return;
    brand.hidden = true;
    brand.removeEventListener('animationend', off);
  });

  paintWeek();
  paintLangPick();
  show('home');
})();
