/* 지우개 셈 — 분석 로그
 *
 * 게임 코드는 Track('game_won', { mode, n, ... }) 한 줄만 부른다. 어디로 보낼지는 여기서 고른다
 * (ads.js·update.js 와 같은 짜임).
 *
 *   앱(안드로이드)  Firebase Analytics — google-services.json 과 @capacitor-firebase/analytics 가 있어야 쌓인다
 *   토스 미니앱      토스 로그(Analytics.log) — 다리 toss_bridge.js 의 window.Toss.track
 *   웹·아직 안 붙은 곳  아무 데도 안 보낸다(콘솔에만). 절대 던지지 않는다 — 로그가 안 남는 것과 게임이 죽는 것은 다르다.
 *
 * 판 도중에는 보내지 않는다(webview-perf 문서: gtag 한 번에 7~20ms). 쌓아 두었다가 판이 끝나거나
 * 화면이 바뀔 때 보낸다.
 */
(function () {
  'use strict';
  const cap = window.Capacitor;
  const native = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const FA = !native ? null
    : (cap.registerPlugin ? cap.registerPlugin('FirebaseAnalytics') : (cap.Plugins && cap.Plugins.FirebaseAnalytics) || null);
  const Toss = window.Toss && window.Toss.inToss ? window.Toss : null;
  const DEBUG = !native && !Toss;

  const queue = [];
  let sending = false;

  function send(name, params) {
    if (Toss) {
      Toss.track(name, params);
    } else if (FA && FA.logEvent) {
      try { FA.logEvent({ name, params }); } catch (e) { /* 조용히 */ }
    } else if (DEBUG) {
      console.log('[분석]', name, params || {});
    }
  }

  function flush() {
    if (sending) return;
    sending = true;
    while (queue.length) {
      const [name, params] = queue.shift();
      send(name, params);
    }
    sending = false;
  }

  /** 이벤트 하나. 판 도중이면 쌓아 두었다가 나중에 보낸다. */
  window.Track = function Track(name, params) {
    queue.push([name, params]);
    const inPlay = window.Game && window.Game.playing && window.Game.playing();
    if (!inPlay) flush();
  };
  window.TrackFlush = flush;

  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
})();
