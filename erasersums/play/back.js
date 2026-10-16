/* 지우개 셈 — 뒤로가기 (안드로이드 앱)
 *
 * 아무것도 안 붙이면 웹뷰에 히스토리가 없어서 **한 번에 앱이 그냥 꺼진다** — 판을 하다
 * 잘못 눌러도 꺼진다(스도쿠에서 겪은 것).
 *
 * 그래서 두 단계로 받는다.
 *   1. 겹쳐 있는 것이 있으면 **맨 위 하나만** 닫는다. 한 번 눌러 다 닫히면 놀란다.
 *        나가기 물음 → 말풍선 → 설정 창 → 결과 창 → 판 화면 → 여정 지도 → 게임 방법·새 게임 창 → 홈이 아닌 탭
 *   2. 홈에서 닫을 게 없으면 나갈지 묻는다. 바로 꺼지면 "왜 꺼졌지" 가 된다.
 *
 * 무엇을 닫을지는 각 화면이 안다 — 여기서는 순서만 정하고 Game.closeTop / Home.closeTop 에 맡긴다.
 * 토스 미니앱에서는 토스 뒤로가기(backEvent)를 받는다. 구독하는 동안 토스 종료 팝업이 막히므로
 * 닫을 게 없을 때도 우리가 묻고, 끄기는 closeView 로 한다.
 * 웹(아티팩트 링크)에서는 아무것도 하지 않는다.
 */
(function () {
  'use strict';
  const cap = window.Capacitor;
  const native = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const App = !native ? null
    : (cap.registerPlugin ? cap.registerPlugin('App') : (cap.Plugins && cap.Plugins.App) || null);

  const Toss = window.Toss && window.Toss.inToss ? window.Toss : null;
  const $ = (id) => document.getElementById(id);
  let asking = false;   // 나가기 물음창이 떠 있다

  /** 맨 위에 있는 것 하나를 닫는다. 닫을 게 있었으면 true. */
  function pop() {
    if (asking) { closeAsk(); return true; }
    // 판 쪽(말풍선·설정 창·결과 창·판 화면)
    if (window.Game && window.Game.closeTop && window.Game.closeTop()) return true;
    // 여정 지도
    const map = $('journey');
    if (map && !map.hidden && window.Journey) {
      window.Journey.close();
      if (window.Journey.onClose) window.Journey.onClose();
      return true;
    }
    // 수상 화면
    if (window.Awards && window.Awards.closeTop()) return true;
    if (window.Pass && window.Pass.closeTop()) return true;
    // 홈 쪽(게임 방법·새 게임 창·다른 탭)
    if (window.Home && window.Home.closeTop && window.Home.closeTop()) return true;
    return false;
  }

  function closeAsk() {
    asking = false;
    if (window.Game && window.Game.hideModal) window.Game.hideModal();
  }
  function quit() {
    closeAsk();
    if (Toss) { Toss.close(); return; }
    try { App.exitApp(); } catch (e) { /* 못 닫으면 그냥 둔다 */ }
  }
  /** 홈에서 더 닫을 게 없을 때. 판 결과 창과 같은 창을 쓴다. */
  function ask() {
    if (asking || !window.Game || !window.Game.modal) { quit(); return; }
    asking = true;
    window.Game.modal({
      title: '지우개 셈을 끌까요?',
      body: '하던 판은 저장돼 있어요. 다음에 이어서 해요.',
      actions: [
        { label: '계속하기', fn: closeAsk },
        { label: '끄기', kind: 'ghost', fn: quit },
      ],
    });
  }

  window.Back = { pop, ask };

  if (Toss) { Toss.back.listen(() => { if (!pop()) ask(); }); return; }

  if (!native || !App) return;
  App.addListener('backButton', () => { if (!pop()) ask(); });
})();
