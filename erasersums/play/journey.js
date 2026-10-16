/* 지우개 셈 — 여정 (클래식 스도쿠 여정을 따라 만듦)
 *
 * 레벨을 길 위의 단계로 늘어놓는다. 단계 n 의 판은 누구에게나 같다(레벨 번호가 씨앗).
 * 장(10단계)마다 풍경(공책에 색연필로 그린 그림)이 바뀌고, 판 크기는 puzzle.js sizeFor 가 정한다:
 *   쉬어 가는 판(작게) · 본판 · 본판 · 쉬어 가는 판 · 본판(미션) · 본판 · 쉬어 가는 판 · 본판(미션) · 본판 · 마무리(크게)
 *
 * 미션 단계: 장마다 두 판(1장은 한 판) — 힌트 없이 · 실수 없이 · 몇 분 안에. 못 지켜도 깨는 것은 되고 별이 하나.
 * 별: 보통 단계는 실수·힌트 없이 3개, 실수 1번 이하 2개, 그냥 깨면 1개.
 *     미션 단계는 미션을 지키면 2개, 거기에 실수·힌트까지 없으면 3개, 못 지키면 1개.
 * 장의 마지막 단계를 처음 깨면 장 보상으로 힌트.
 *
 *   Store.d.journey = { stars: { [단계]: 1|2|3 } } — 깬 단계만. 지금 차례는 Store.d.level.
 */
(function () {
  'use strict';
  const St = window.Store, CS = window.CrossSum;
  const $ = (id) => document.getElementById(id);
  const d = St.d;

  const PER = 10;
  const CHAPTER_HINTS = 2;
  // 장마다 풍경 — ChatGPT 로 그린 색연필 그림(journey/bg/<key>.webp, 원본 art/src/). 열두 장마다 다시 돈다.
  const THEMES = ['rapeseed', 'blossom', 'beach', 'paddy', 'sunflower', 'hanok',
    'maple', 'reed', 'snow', 'lighthouse', 'camp', 'lotus'];
  const chapterOf = (s) => Math.ceil(s / PER);
  // [그림 키, 그 나라 말 이름] — 이름은 부를 때 번역한다(i18n.js theme.<키>)
  const themeOf = (ch) => { const k = THEMES[(ch - 1) % THEMES.length]; return [k, T('theme.' + k)]; };
  // 장의 기본 크기 = 장 안 5번째 판 (쉬어 가는 판·마무리가 아닌 자리)
  const chapterSize = (ch) => CS.sizeFor((ch - 1) * PER + 5);

  // ── 미션 ──
  const KINDS = ['noHint', 'noMistake', 'timed'];
  // 크기마다 "몇 분 안에" — 첫 짐작, 실제 기록 보고 고칠 것
  const TIMED = { 3: 1, 4: 1, 5: 2, 6: 3, 7: 5, 8: 7, 9: 10 };
  function mission(stage) {
    const ch = chapterOf(stage) - 1;
    const k = (stage - 1) % PER;
    const slot = k === 4 ? 0 : k === 7 ? 1 : -1;
    if (slot < 0 || (ch === 0 && slot === 0)) return null;
    const kind = KINDS[(ch * 2 + slot) % KINDS.length];
    return kind === 'timed' ? { kind, minutes: TIMED[CS.sizeFor(stage)] } : { kind };
  }
  function missionText(m) {
    if (m.kind === 'noHint') return T('mission.noHint');
    if (m.kind === 'noMistake') return T('mission.noMistake');
    return T('mission.timed', { n: m.minutes });
  }
  function missionMet(m, p) {
    if (m.kind === 'noHint') return p.hintsUsed === 0;
    if (m.kind === 'noMistake') return p.mistakes === 0;
    return p.elapsed <= m.minutes * 60000;
  }
  // p = { mistakes, hintsUsed, elapsed }
  function starsFor(stage, p) {
    const perfect = p.mistakes === 0 && p.hintsUsed === 0;
    const m = mission(stage);
    if (m) return !missionMet(m, p) ? 1 : perfect ? 3 : 2;
    if (perfect) return 3;
    if (p.mistakes <= 1) return 2;
    return 1;
  }

  // ── 기록 ──
  const stars = () => d.journey.stars;
  const current = () => d.level;
  const totalStars = () => Object.values(stars()).reduce((a, b) => a + b, 0);
  function record(stage, got) {
    const prev = stars()[stage];
    const firstClear = prev === undefined;
    const better = !firstClear && got > prev;
    if (firstClear || better) stars()[stage] = got;
    d.level = Math.max(d.level, stage + 1);
    const bonus = firstClear && stage % PER === 0 ? CHAPTER_HINTS : 0;
    if (bonus) d.hints += bonus;
    St.save();
    return { stars: got, best: firstClear || better ? got : prev, firstClear, better, bonus };
  }

  // ── 지도 ──
  const ROW = 104;              // 한 단계 높이(px)
  const SWAY = [0, 24, 0, -24]; // 길이 좌우로 흔들리는 자리(가운데 기준 %)
  const IMG = (n) => `<img src="icons/${n}.webp" alt="" aria-hidden="true">`;
  const LOCK = IMG('lock');

  function roadPath(xs) {
    const y = (k) => k * ROW + ROW / 2;
    let p = `M ${xs[0]} 0 L ${xs[0]} ${y(0)}`;
    for (let k = 1; k < xs.length; k++) {
      const mid = (y(k - 1) + y(k)) / 2;
      p += ` C ${xs[k - 1]} ${mid}, ${xs[k]} ${mid}, ${xs[k]} ${y(k)}`;
    }
    return p + ` L ${xs[xs.length - 1]} ${y(xs.length - 1) + ROW / 2}`;
  }

  let onPlay = null;
  function render() {
    const now = current();
    const got = stars();
    // 지금 장의 끝 + 앞으로 세 장 — 길이 이어진다는 게 보여야 "조금만 더" 가 생긴다
    const lastCh = chapterOf(now) + 3;
    let html = '';
    for (let c = 1; c <= lastCh; c++) {
      const first = (c - 1) * PER + 1;
      const xs = [], nodes = [];
      let sum = 0;
      for (let k = 0; k < PER; k++) {
        const s = first + k;
        xs.push(50 + SWAY[(s - 1) % SWAY.length]);
        sum += got[s] || 0;
      }
      const h = PER * ROW;
      const road = roadPath(xs);
      const [key, name] = themeOf(c);
      const base = chapterSize(c);
      for (let k = 0; k < PER; k++) {
        const s = first + k;
        const st = got[s];
        const state = s < now || st ? 'done' : s === now ? 'now' : 'locked';
        const boss = s % PER === 0;
        const n = CS.sizeFor(s);
        const m = mission(s);
        let inner = '';
        if (state === 'now') inner += `<span class="stage-here">${T('journey.here')}</span>`;
        if (state === 'done') {
          inner += `<span class="stage-stars" aria-label="${T('journey.starsAria', { n: st || 0 })}">` +
            [1, 2, 3].map((i) => `<i class="${i <= (st || 0) ? 'on' : ''}">★</i>`).join('') + '</span>';
        }
        inner += `<span class="stage-dot">${boss ? IMG(state === 'done' ? 'crown' : 'gift') : state === 'locked' ? LOCK : s}</span>`;
        if (n !== base) inner += `<span class="stage-tag">${n}×${n}</span>`;
        if (m) inner += `<span class="stage-mission" title="${missionText(m)}">${IMG('target')}</span>`;
        if (boss && state !== 'done') inner += `<span class="stage-tag boss-tag">${T('journey.bossTag', { n: CHAPTER_HINTS })}</span>`;
        nodes.push(`<button type="button" class="stage ${state}${boss ? ' boss' : ''}" data-stage="${s}" ` +
          `style="left:${xs[k]}%;top:${k * ROW + ROW / 2}px" aria-label="${s}단계${m ? ', 미션 ' + missionText(m) : ''}">${inner}</button>`);
      }
      const locked = first > now;
      const far = c > chapterOf(now) + 1;
      html += `<section class="journey-chapter theme-${key}${locked ? ' chapter-locked' : ''}${far ? ' chapter-far' : ''}" ` +
        `style="--bg:url(journey/bg/${key}.webp)">` +
        `<div class="journey-banner"><span class="journey-banner-no">${T('journey.chapter', { n: c })}</span><span class="journey-banner-name">${name}</span>` +
        `<span class="journey-banner-sub">${base}×${base} · ★ ${sum}/${PER * 3}</span></div>` +
        `<div class="journey-path" style="height:${h}px">` +
        `<svg class="journey-road" viewBox="0 0 100 ${h}" preserveAspectRatio="none" aria-hidden="true">` +
        `<path class="road-edge" d="${road}" vector-effect="non-scaling-stroke"/>` +
        `<path class="road-fill" d="${road}" vector-effect="non-scaling-stroke"/>` +
        `<path class="road-dash" d="${road}" vector-effect="non-scaling-stroke"/></svg>` +
        nodes.join('') + '</div></section>';
    }
    $('journeyMap').innerHTML = html;
    $('journeyTotal').textContent = `★ ${totalStars()}`;
  }

  function open(play) {
    onPlay = play;
    render();
    $('journey').hidden = false;
    // 열면 지금 차례로 저절로 내려간다
    const nowEl = $('journeyMap').querySelector('.stage.now');
    if (nowEl) nowEl.scrollIntoView({ block: 'center' });
  }
  function close() { $('journey').hidden = true; }
  const sfx = (n, at, i) => { if (window.Sfx) window.Sfx(n, at, i); };

  let toastTimer = 0;
  $('journeyMap').addEventListener('click', (e) => {
    const b = e.target.closest('.stage');
    if (!b) return;
    if (b.classList.contains('locked')) {
      const t = $('journeyToast');
      t.hidden = false;
      sfx('deny');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { t.hidden = true; }, 1800);
      return;
    }
    close();
    if (onPlay) onPlay(+b.dataset.stage);
  });
  $('journeyBack').addEventListener('click', () => { sfx('close'); close(); if (window.Journey.onClose) window.Journey.onClose(); });

  window.Journey = { PER, chapterOf, themeOf, mission, missionText, missionMet, starsFor, record, totalStars, open, close, onClose: null };
})();
