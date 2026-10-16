/* 지우개 셈 — 수상 (트로피 진열장. 클래식 스도쿠 src/ui/AwardsView.tsx 를 옮김)
 *
 * 화면 전체를 덮고 열린다(여정 지도와 같은 꼴). 통계 탭의 「수상」 카드에서 들어온다.
 *   업적   achievements.js 의 목록. 못 딴 것은 흐리게 + 진행도, 딴 것은 제 색
 *   월간   달마다 트로피 하나(스도쿠 월간 시즌과 같다) — 그달 오늘의 퍼즐을 10일 = 동, 20일 = 은, 하루도 안 빼면 = 금.
 *          그림은 달마다 계절 모양(awards/months/m01~12.webp, 금색 그림). 은·동·못 딴 달은 CSS 필터로 칠한다.
 *          그 달 안에 푼 날만 센다 — 지난 달 판을 나중에 풀어도 날짜는 판의 날짜라 그대로 그 달에 들어간다
 *   대결   (토스) 달마다 배지 하나 — 그달 승수로 돌·초록·파랑·금, 아래에 그달 시즌 엠블럼
 * 카드를 누르면 결과 창과 같은 창에 크게 보여 준다.
 */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const A = window.Achievements;
  const sfx = (n) => { if (window.Sfx) window.Sfx(n); };
  let tab = 'ach';

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function paintTabs() {
    const hasBattle = !!(window.Battle && window.Battle.open);
    $('awardTabs').querySelector('[data-atab="battle"]').hidden = !hasBattle;
    if (!hasBattle && tab === 'battle') tab = 'ach';
    $('awardTabs').querySelectorAll('[data-atab]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.atab === tab)));
  }

  // ── 월간 ──
  const St = window.Store;
  const pad = (n) => String(n).padStart(2, '0');
  const daysIn = (y, m) => new Date(y, m, 0).getDate();
  function monthTier(days, total) {
    if (days >= total) return 'gold';
    if (days >= 20) return 'silver';
    if (days >= 10) return 'bronze';
    return null;
  }
  /** 처음 오늘의 퍼즐을 푼 달부터 이번 달까지(빠진 달도 넣는다 — 빈 칸이 보여야 "다음 달은 채우자"). 최근 달이 먼저 */
  function months() {
    const now = St.parseKey(St.dateKey());
    const done = St.d.daily.slice().sort();
    let [y, m] = done.length ? done[0].split('-').map(Number) : [now.y, now.m];
    const out = [];
    for (let guard = 0; guard < 240; guard++) {
      const key = `${y}-${pad(m)}`, total = daysIn(y, m);
      const days = done.filter((k) => k.startsWith(key + '-')).length;
      out.push({ y, m, days, total, tier: monthTier(days, total), now: y === now.y && m === now.m });
      if (y === now.y && m === now.m) break;
      if (++m > 12) { m = 1; y++; }
    }
    return out.reverse();
  }
  function renderMonth() {
    $('awardSum').textContent = T('awards.monthHow');
    let html = '<ul class="award-grid">', year = null;
    for (const r of months()) {
      if (r.y !== year) { year = r.y; html += `<li class="award-year">${r.y}</li>`; }
      const next = !r.tier ? ['bronze', 10] : r.tier === 'bronze' ? ['silver', 20] : r.tier === 'silver' ? ['gold', r.total] : null;
      html += `<li><div class="award month ${r.tier || 'locked'}${r.now ? ' now' : ''}">` +
        `<img src="awards/months/m${pad(r.m)}.webp" alt="" loading="lazy">` +
        `<span class="award-name">${T('awards.month', { m: r.m })}</span>` +
        `<span class="award-prog">${T('awards.monthDays', { d: r.days, t: r.total })}</span>` +
        (r.now && next ? `<span class="award-prog">${T('awards.monthNext', { t: T('awards.tier.' + next[0]), n: next[1] - r.days })}</span>` : '') +
        '</div></li>';
    }
    $('awardBody').innerHTML = html + '</ul>';
  }

  function renderAch() {
    const list = A.list();
    const done = list.filter((a) => a.done).length;
    $('awardSum').textContent = T('awards.sum', { d: done, t: list.length });
    $('awardBody').innerHTML = '<ul class="award-grid">' + list.map((a) =>
      `<li><button type="button" class="award${a.done ? '' : ' locked'}" data-ach="${a.id}">` +
      `<img src="${A.src(a.id)}" alt="" loading="lazy">` +
      `<span class="award-name">${esc(A.name(a.id))}</span>` +
      (!a.done && a.target > 1 ? `<span class="award-prog">${a.current}/${a.target}</span>` : '') +
      '</button></li>').join('') + '</ul>';
    A.markViewed();
    if (window.Home && window.Home.paintDots) window.Home.paintDots();
  }

  function renderBattle() {
    const ms = window.Battle.months();
    $('awardSum').textContent = '';
    if (!ms.length) { $('awardBody').innerHTML = `<p class="award-empty">${T('awards.battleEmpty')}</p>`; return; }
    let html = '<ul class="award-grid">', year = null;
    for (const m of ms) {
      if (m.y !== year) { year = m.y; html += `<li class="award-year">${m.y}</li>`; }
      html += `<li><div class="award badge-card">` +
        `<span class="badge-wrap"><img src="awards/badges/${m.badge}.webp" alt=""><b>${m.won}</b></span>` +
        `<img class="badge-emblem" src="awards/season/${m.tier}.webp" alt="">` +
        `<span class="award-name">${T('awards.month', { m: m.m })}</span>` +
        `<span class="award-prog">${T('battle.record', { w: m.won, l: m.lost })}</span></div></li>`;
    }
    $('awardBody').innerHTML = html + '</ul>';
  }

  function render() {
    paintTabs();
    if (tab === 'battle') renderBattle(); else if (tab === 'month') renderMonth(); else renderAch();
  }

  function open(which) {
    tab = which || 'ach';
    A.markSeen();   // 판 밖에서 단 것(예: 데일리 기록이 쌓여 이어진 날)도 여기서 잡는다
    render();
    $('awards').hidden = false;
    $('awards').scrollTop = 0;
    sfx('open');
  }
  function close() {
    if ($('awards').hidden) return false;
    $('awards').hidden = true;
    sfx('close');
    if (window.Home) window.Home.show('stats');
    return true;
  }

  $('awardsBack').addEventListener('click', close);
  $('awardTabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-atab]');
    if (!b || b.dataset.atab === tab) return;
    tab = b.dataset.atab;
    sfx('tool');
    render();
  });
  $('awardBody').addEventListener('click', (e) => {
    const b = e.target.closest('[data-ach]');
    if (!b) return;
    const a = A.list().find((x) => x.id === b.dataset.ach);
    if (!a) return;
    sfx('tap');
    window.Game.modal({
      title: A.name(a.id),
      body: `<img class="award-big${a.done ? '' : ' locked'}" src="${A.src(a.id)}" alt=""><br>${esc(A.desc(a.id))}` +
        `<br><span class="award-state">${a.done ? T('awards.got') : T('awards.progress', { c: a.current, t: a.target })}</span>`,
      actions: [{ label: T('battle.ok'), fn: () => window.Game.hideModal() }],
    });
  });
  document.addEventListener('langchange', () => { if (!$('awards').hidden) render(); });

  window.Awards = { open, close, closeTop: close };
})();
