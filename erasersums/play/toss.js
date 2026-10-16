/* 지우개 셈 — 토스 미니앱에서만 하는 것 (토스 밖에서는 아무것도 안 한다)
 *
 * 다리(toss/bridge, toss_bridge.js)가 내놓는 window.Toss 를 쓴다. 다리는 토스 번들에만 실린다.
 *
 *   순위표   설정 탭의 카드를 Play 게임즈 대신 토스 게임센터로 쓴다. 점수는 안드로이드와 같은 여정 별 합계.
 *            판을 깰 때마다(game.js 가 Games.sync 를 부르는 자리) 더 커졌으면 올린다.
 *            답이 SUCCESS 일 때만 올린 것으로 적는다 — 게임 프로필이 없으면 PROFILE_NOT_FOUND 를 던지지 않고
 *            돌려준다(문명 2048 이 이걸 놓쳐 순위표를 안 연 사람은 순위에 없었다). 순위표를 열면 프로필이
 *            만들어지므로, 돌아왔을 때(visibilitychange) 다시 올린다.
 *   별점     다섯 판째를 깬 뒤 한 번 Review.request. 떴는지는 토스가 안 알려 준다 — 불렀다까지만.
 *            토스포인트를 받은 판에는 묻지 않는다(지급 알림과 별점 창이 겹치지 않게) — 다음 판에 묻는다.
 *   지급     토스포인트 프로모션 네 개. **진짜 돈이 비즈월렛에서 나간다.**
 *              첫 판   판을 처음 깨면 3원          혜택탭 「지우개셈 첫 판 해보기」
 *              다음날  처음 깬 다음 날 이후 또 깨면 2원  혜택탭 「지우개셈 내일도 해보기」
 *              세 판   (2026-10-08 종료, 패스로 바꿈) 그날 세 판 깰 때마다 2원, 하루 10원까지(= 15판)  혜택탭 없음 — 앱 안에서만 알린다.
 *                      전면 광고(깬 판 셋에 한 번)와 배너로 세 판에 1.2~2.5원쯤 벌어 본전 근처다(2026-10-07 타일·애로우 기준).
 *                      판을 깰 때마다 "n판 더 깨면 2원" 을 띄워 한 판 더 하게 만드는 게 목적
 *              패스   월간 패스(pass.js) 마지막 칸 300별에 30원, 한 달에 한 번. 코드가 비면 그 칸은 힌트
 *            미션 이름은 행동("~해보기")이지만 조건은 "판을 깼다" — 아무렇게나 눌러 받아 가지 않게(타일 피스트와 같다).
 *            **지급에 성공한 뒤에만 받았다고 적는다** — 먼저 적으면 아직 RUNNING 이 아니거나(4109) 통신이 끊긴
 *            사람이 영영 못 받는다. 두 번 나가는 것은 토스가 막지만 한도가 '하루' 라, 미션마다 한 번은 여기서 막는다.
 *            받을 게 남아 있으면 판을 열 때 먼저 알려 준다 — 혜택탭을 보고 온 사람이 "깨야 받는다" 를 모르고 나가지 않게.
 */
(function () {
  'use strict';
  const Toss = window.Toss && window.Toss.inToss ? window.Toss : null;
  if (!Toss) return;

  const St = window.Store;
  const d = St.d;
  const $ = (id) => document.getElementById(id);
  const KEY = 'jiugae-toss';
  const REVIEW_AT = 5;   // 다섯 판째 — 토스 유입이 닿는 앞쪽

  let mem = {};
  try { mem = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { mem = {}; }
  const keep = () => { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* 다음에 다시 */ } };
  const stars = () => (window.Journey ? window.Journey.totalStars() : 0);

  let sending = false;
  async function submit() {
    const n = stars();
    if (sending || !Toss.game.available || n <= (mem.score || 0)) return;
    sending = true;
    try {
      const status = await Toss.game.submit(n);
      if (status === 'SUCCESS') { mem.score = n; keep(); }
      mem.status = status;
      if (window.Track) window.Track('toss_lb_submit', { status, stars: n });
    } finally {
      sending = false;
      paint();
    }
  }

  function maybeReview() {
    if (mem.reviewed || !Toss.review.available) return;
    if ((d.stats.solved || 0) < REVIEW_AT) return;
    mem.reviewed = 1;   // 조르지 않게, 부르기 전에 적는다
    keep();
    if (window.Track) window.Track('toss_review_ask', { solved: d.stats.solved });
    Toss.review.ask();
  }

  // ── 토스포인트 프로모션 ──
  // 콘솔 프로모션(2026-10-07 만듦, 2027-01-31 까지, 예산 각 2,000원) — store/toss/listing.md 「프로모션」.
  // 승인 → 지급 시험 번들(isTested) → 이 코드가 든 번들 출시 → RUNNING 순서. 그 전에는 지급이 거절되고, 적지 않으니 나중에 받는다.
  const PROMO = {
    first: { code: '01M49GGQQWSYGD0S0Q752E0XQC', amount: 3 },   // 「지우개 셈 첫 판 해보기 리워드」 id 60329
    next: { code: '01M49GGWHQ8KRY6RAWYHB6JTMY', amount: 2 },    // 「지우개 셈 다음날 또 해보기 리워드」 id 60333
    // 「지우개 셈 세 판씩 해보기 리워드」 id 60379 (2026-10-07, 예산 3,000원, 1인 하루 10원). 5원짜리(60369)는 손해라 만들자마자 종료.
    // 2026-10-08 월간 패스가 대신하기로 하고 **종료**(검토 중에 끝내 한 번도 안 켬). 코드는 비운 채 둔다
    three: { code: '', amount: 2, every: 3, daily: 10 },
    // 「지우개 셈 월간 패스 완주 리워드」 id 61219 (2026-10-08, 예산 3,000원, 1인 하루 30원) — 패스 마지막 칸(300).
    // 코드가 비어 있으면 그 칸은 힌트(pass.js). 같은 날 승인
    pass: { code: '01M4CMMRPH6T657XNTKFK35AY2', amount: 30 },
  };
  const ONCE = ['first', 'next'];   // 한 사람에게 한 번씩. three 는 날마다 되풀이(threeOnWin)
  // 다음날은 한국 날짜로 센다(24시간이 아니라)
  const kst = () => new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
  const tried = {};   // 한 번 켤 때 미션마다 한 번만 — 실패하는 지급을 판마다 두드리지 않게. 다음에 켜면 다시

  // mem.pf = 처음 판을 깬 날(한국 날짜), mem.pg = 미션별 받은 시각
  function pending(id) {
    if (!Toss.promo.available || Toss.promo.test) return false;
    if ((mem.pg || {})[id]) return false;
    return id === 'first' || (!!mem.pf && kst() > mem.pf);
  }

  // 세 판 미션. mem.td = 센 날(한국 날짜), mem.tc = 지난번 받은 뒤 깬 판 수, mem.tg = 그날 받은 금액
  let threePaused = 0;   // 지급이 거절되면(아직 시작 전·예산 소진·통신) 10분 쉰다 — 판마다 두드리지 않게
  function threeToday() {
    if (mem.td !== kst()) { mem.td = kst(); mem.tc = 0; mem.tg = 0; }
  }
  function threeOpen() {
    if (!PROMO.three.code || !Toss.promo.available || Toss.promo.test) return false;
    threeToday();
    return (mem.tg || 0) + PROMO.three.amount <= PROMO.three.daily;
  }
  /** 판을 깼을 때 세 판 미션. { got: 받은 금액, left: 다음 지급까지 남은 판 수(0 이면 알릴 것 없음) } */
  async function threeOnWin() {
    const m = PROMO.three;
    if (!threeOpen()) return { got: 0, left: 0 };
    mem.tc = (mem.tc || 0) + 1;
    keep();
    // 지급이 막혀 쉬는 동안에는 "n판 더" 를 띄우지 않는다 — 주지도 못할 걸 약속하지 않게
    if (Date.now() < threePaused) return { got: 0, left: 0 };
    if (mem.tc < m.every) return { got: 0, left: m.every - mem.tc };
    const r = await Toss.promo.grant(m.code, m.amount);
    if (window.Track) window.Track('toss_promo', { m: 'three', r });
    // 실패하면 센 판을 그대로 둔다 — 다음에 깰 때 다시 해 본다
    if (r !== 'ok') { threePaused = Date.now() + 10 * 60000; return { got: 0, left: 0 }; }
    mem.tc = 0;
    mem.tg = (mem.tg || 0) + m.amount;
    keep();
    return { got: m.amount, left: 0 };
  }

  /** 판을 깼을 때. 이번에 받은 금액(원)을 돌려준다. 던지지 않는다 */
  async function promoOnWin() {
    if (!mem.pf) { mem.pf = kst(); keep(); }
    let got = 0;
    for (const id of ONCE) {
      if (!pending(id) || tried[id]) continue;
      tried[id] = 1;
      const m = PROMO[id];
      const r = await Toss.promo.grant(m.code, m.amount);
      if (window.Track) window.Track('toss_promo', { m: id, r });
      if (r !== 'ok') continue;
      (mem.pg = mem.pg || {})[id] = Date.now();
      keep();
      got += m.amount;
    }
    const three = await threeOnWin();
    got += three.got;
    if (!window.Game) return got;
    if (got) window.Game.toast(T('toss.promo.got', { n: got }));
    else if (three.left) window.Game.toast(T('toss.promo.threeLeft', { k: three.left, n: PROMO.three.amount }));
    return got;
  }

  // 월간 패스 마지막 칸(pass.js). 한 달에 한 번이라 하루 한도로 두 번 나가는 건 토스가, 같은 달 두 번은 pass.js 가 막는다
  if (PROMO.pass.code && Toss.promo.available && !Toss.promo.test) {
    window.PassToss = {
      amount: PROMO.pass.amount,
      claim: () => Toss.promo.grant(PROMO.pass.code, PROMO.pass.amount),
    };
  }

  // 판을 열 때 받을 게 남아 있으면 한 번 알려 준다(켤 때마다 한 번)
  const Game = window.Game;
  if (Game && Game.start) {
    const start = Game.start;
    let told = false;
    Game.start = function () {
      start.apply(this, arguments);
      if (told) return;
      const id = pending('first') ? 'first' : pending('next') ? 'next' : threeOpen() ? 'three' : '';
      if (!id) return;
      told = true;
      setTimeout(() => Game.toast(T('toss.promo.' + id, { n: PROMO[id].amount, m: PROMO.three.daily })), 600);
    };
  }

  // 지급 시험 번들(PROMO_TEST): 켜고 3초 뒤 미션마다 TEST_ 코드로 한 번씩 부르고 결과를 띄운다. 예산은 안 쓴다.
  // 결과 상자는 부르기 **전에** 띄운다 — 끝나고 띄우면 "코드가 안 돌았다" 와 "지급이 멈췄다" 를 못 가린다. 누르면 닫힌다.
  if (Toss.promo.test) {
    const box = document.createElement('pre');
    box.style.cssText = 'position:fixed;left:12px;right:12px;top:40%;z-index:99;margin:0;padding:14px;border:2px solid #d33;' +
      'border-radius:12px;background:#fff;color:#111;font:14px monospace;white-space:pre-wrap';
    box.textContent = 'PROMO TEST — 3초 뒤 부름';
    box.addEventListener('click', () => box.remove());
    document.body.appendChild(box);
    setTimeout(async () => {
      const lines = [];
      for (const id of Object.keys(PROMO)) {
        const m = PROMO[id];
        if (!m.code) { lines.push(`${id}: 코드 없음(꺼 둠)`); continue; }
        const r = await Toss.promo.grant('TEST_' + m.code, m.amount);
        lines.push(`${id} TEST_${m.code} ${m.amount}원: ${r}`);
        box.textContent = ['PROMO TEST'].concat(lines).join('\n');
      }
    }, 3000);
  }

  // game.js 는 판을 깰 때마다 Games.sync() 를 부른다. 토스에서는 Play 게임즈가 없으니 여기로 받는다.
  const G = window.Games || (window.Games = {});
  G.sync = function () {
    submit();
    // 결과 창이 뜬 다음 별점. 토스포인트를 받은 판에는 묻지 않는다 — 다음 판에
    promoOnWin().catch(() => 0).then((got) => { if (!got) setTimeout(maybeReview, 1500); });
  };

  // ── 설정 탭 카드 ──
  function paint() {
    // 홈 위 「순위」 배지(스도쿠 홈과 같은 자리) — 설정 탭 카드와 같은 순위표를 연다
    if ($('hRank')) $('hRank').hidden = !Toss.game.available;
    const card = $('gamesCard');
    if (!card) return;
    card.hidden = !Toss.game.available;
    if (card.hidden) return;
    card.querySelector('h2').textContent = T('toss.lb.title');
    $('gamesWho').textContent = mem.status === 'PROFILE_NOT_FOUND' ? T('toss.lb.noProfile') : T('toss.lb.desc', { n: stars() });
    $('gamesConnect').hidden = true;
    $('gamesAch').hidden = true;
    $('gamesBoard').hidden = false;
  }
  if ($('hRank')) {
    $('hRank').addEventListener('click', () => {
      if (window.Track) window.Track('toss_lb_open', { from: 'home' });
      Toss.game.open();
    });
  }
  if ($('gamesBoard')) {
    $('gamesBoard').addEventListener('click', () => {
      if (window.Track) window.Track('toss_lb_open', {});
      Toss.game.open();
    });
  }
  // 순위표(게임센터 웹뷰)에서 돌아오면 — 그 사이 프로필이 생겼을 수 있다
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    if (mem.status && mem.status !== 'SUCCESS') { mem.score = 0; submit(); }
    paint();
  });
  document.addEventListener('langchange', paint);
  document.addEventListener('DOMContentLoaded', paint);
  paint();
  // 예전에 깬 별이 있으면 한 번 올려 둔다(첫 화면이 뜬 뒤)
  setTimeout(submit, 3000);
})();
