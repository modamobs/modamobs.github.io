/* 지우개 셈 — 업적 (앱 안에서 보는 트로피. 클래식 스도쿠 src/achievements/achievements.ts 를 옮김)
 *
 * 보상은 없다 — 모으는 재미만. 트로피 그림은 awards/trophies/<id>.webp (스도쿠 그림을 이름만 바꿔 씀).
 * 안드로이드 Play 게임즈 업적(games.js 의 ACH)과는 따로다 — 이건 토스·안드로이드·웹 모두에서 보인다.
 *
 * 진행도는 대부분 **이미 있는 기록에서 그때그때 다시 센다**(푼 판·크기별·최고 기록·데일리·여정·대결 전적).
 * 그래서 업적이 생기기 전에 한 것도 소급해서 달성된다. 따로 세는 것은 힌트 없이 이긴 판 하나뿐.
 *
 *   seen    달성했다고 알린 것 — 판을 깬 창에 "업적 달성 · 이름" 을 한 번만 띄우려고
 *   viewed  수상 화면에서 본 것 — 아직 안 본 게 있으면 통계 탭에 점
 */
(function () {
  'use strict';
  const St = window.Store;
  const d = St.d;
  const KEY = 'jiugae-ach';

  let saved = { noHint: 0, seen: [], viewed: [] };
  let first = false;   // 업적이 생기고 처음 켰다 — 그동안 쌓인 기록으로 이미 단 것은 알림 없이 넘긴다
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw) saved = Object.assign(saved, raw); else first = true;
  } catch (e) { /* 새로 */ }
  const keep = () => { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { /* 괜찮다 */ } };

  const size = (n) => St.sizeStat(n);
  const stageCleared = () => d.level - 1;
  // 데일리를 하루도 안 빼고 이어 푼 가장 긴 날 수
  function bestDailyRun() {
    const days = [...new Set(d.daily)].sort();
    let best = 0, run = 0, prev = null;
    for (const k of days) {
      run = prev && St.addDays(prev, 1) === k ? run + 1 : 1;
      best = Math.max(best, run);
      prev = k;
    }
    return best;
  }
  // 열 단계 한 장을 모두 별 셋으로
  function perfectChapter() {
    const s = (d.journey && d.journey.stars) || {};
    for (let c = 1; c * 10 <= stageCleared(); c++) {
      let all = true;
      for (let k = (c - 1) * 10 + 1; k <= c * 10; k++) if (s[k] !== 3) { all = false; break; }
      if (all) return 1;
    }
    return 0;
  }
  const battleWins = () => (window.Battle && window.Battle.open ? window.Battle.record().won : 0);

  // 순서가 곧 화면 순서. [id, 지금 값, 목표]
  function rows() {
    const st = d.stats;
    const regionsWon = [6, 7, 8, 9].reduce((a, n) => a + size(n).won, 0);
    const list = [
      ['first_win', st.solved, 1],
      ['no_hint_win', saved.noHint, 1],
      ['solved_10', st.solved, 10],
      ['solved_50', st.solved, 50],
      ['solved_200', st.solved, 200],
      ['solved_500', st.solved, 500],
      ['perfect_5', st.perfect, 5],
      ['perfect_25', st.perfect, 25],
      ['regions_first', regionsWon, 1],
      ['size_7', size(7).won, 1],
      ['size_8', size(8).won, 1],
      ['size_9', size(9).won, 1],
      ['size9_10', size(9).won, 10],
      ['fast_7', st.best[7] && st.best[7] <= 5 * 60000 ? 1 : 0, 1],
      ['daily_first', d.daily.length, 1],
      ['daily_7', bestDailyRun(), 7],
      ['daily_30', bestDailyRun(), 30],
      ['journey_10', stageCleared(), 10],
      ['journey_30', stageCleared(), 30],
      ['journey_60', stageCleared(), 60],
      ['journey_100', stageCleared(), 100],
      ['journey_perfect', perfectChapter(), 1],
    ];
    // 대결은 토스에서만 열린다 — 못 하는 곳에 못 따는 트로피를 걸어 두지 않는다
    if (window.Battle && window.Battle.open) list.push(['battle_first', battleWins(), 1], ['battle_30', battleWins(), 30]);
    return list.map(([id, cur, target]) => ({ id, current: Math.min(cur || 0, target), target, done: (cur || 0) >= target }));
  }

  /** 새로 달성한 것을 seen 에 넣고 돌려준다 */
  function markSeen() {
    const fresh = rows().filter((a) => a.done && !saved.seen.includes(a.id)).map((a) => a.id);
    if (!fresh.length) return [];
    saved.seen.push(...fresh);
    keep();
    fresh.forEach((id) => { if (window.Track) window.Track('achievement', { id }); });
    return fresh;
  }

  /** 판을 깼을 때(기록을 다 적은 뒤). 새로 단 업적 id 들 */
  function noteWin(p) {
    if (p && p.hintsUsed === 0) { saved.noHint++; keep(); }
    return markSeen();
  }

  function markViewed() {
    const done = rows().filter((a) => a.done).map((a) => a.id);
    if (done.every((id) => saved.viewed.includes(id))) return;
    saved.viewed = done;
    keep();
  }
  /** 달성했는데 수상 화면에서 아직 안 본 것이 있나 (통계 탭 점) */
  const unseen = () => rows().some((a) => a.done && !saved.viewed.includes(a.id));

  // 처음 켠 사람: 이미 단 것은 seen 에만 넣는다(수상 화면의 점은 남는다 — 들어가 보면 다 있다).
  // 안 그러면 업데이트 뒤 첫 판을 깬 창에 "업적 달성" 이 열 줄 넘게 쏟아진다.
  if (first) { saved.seen = rows().filter((a) => a.done).map((a) => a.id); keep(); }

  const src = (id) => `awards/trophies/${id}.webp`;
  const name = (id) => T('ach.' + id);
  const desc = (id) => T('ach.' + id + '.d');

  window.Achievements = { list: rows, markSeen, noteWin, markViewed, unseen, src, name, desc };
})();
