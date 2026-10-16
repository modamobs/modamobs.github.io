/* 지우개 셈 — Play 인앱 업데이트 (안드로이드 전용)
 *
 * 왜: Play 자동 업데이트를 꺼 둔 사람이 많아 옛 버전에 머문다(android-app-update 문서 1).
 * 웹·토스는 열 때마다 최신이라 필요 없다.
 *
 * 흐름 (유연 방식)
 *   켤 때 Play 에 묻는다 → 새 버전이 있고 오늘 '나중에' 를 누르지 않았으면 화면 위에 띠
 *   → [업데이트] 뒤에서 받는다(게임은 그대로) → 다 받으면 [다시 시작] → 설치하고 앱이 다시 켜진다
 *   Play Console 우선순위 4 이상이면 띠 대신 즉시 업데이트(전체 화면).
 *
 * 띠는 fixed 라 홈이든 판이든 같은 자리에 뜬다 — 판을 하다가도 바로 누를 수 있다.
 * 주의: Play 로 설치한 앱에서만 동작한다. adb 로 깐 것은 늘 '업데이트 없음'.
 */
(function () {
  'use strict';
  const cap = window.Capacitor;
  const native = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const Plug = !native ? null
    : (cap.registerPlugin ? cap.registerPlugin('AppUpdate') : (cap.Plugins && cap.Plugins.AppUpdate) || null);
  const App = !native ? null : (cap.registerPlugin ? cap.registerPlugin('App') : (cap.Plugins && cap.Plugins.App) || null);

  const KEY = 'jiugae-update-dismissed';   // 오늘 '나중에' 를 누른 날짜
  const $ = (id) => document.getElementById(id);
  const today = () => new Date().toISOString().slice(0, 10);
  const track = (step) => window.Track && window.Track('app_update', { step });

  let state = 'none';   // none | available | downloading | ready

  function paint() {
    const bar = $('updateBar');
    if (!bar) return;
    bar.hidden = state === 'none';
    $('updateText').textContent =
      state === 'ready' ? T('up.ready') : state === 'downloading' ? T('up.downloading') : T('up.new');
    $('updateLater').hidden = state !== 'available';
    $('updateGo').hidden = state === 'downloading';
    $('updateGo').textContent = T(state === 'ready' ? 'up.restart' : 'up.go');
  }
  function set(s) {
    state = s;
    paint();
    // 띠가 떠 있는 만큼 화면을 내린다(판 화면의 맨 윗줄과 겹치지 않게)
    document.documentElement.style.setProperty('--update-h', s === 'none' ? '0px' : '56px');
  }

  async function check() {
    if (!Plug) return;
    try {
      const r = await Plug.check();
      if (r.inProgress) { await Plug.startImmediate(); return; }   // 즉시 업데이트가 끊겼으면 이어서
      if (r.downloaded) { set('ready'); return; }
      if (!r.available) { set('none'); return; }
      if (r.priority >= 4 && r.immediate) { track('immediate'); await Plug.startImmediate(); return; }
      if (localStorage.getItem(KEY) === today()) { set('none'); return; }
      set('available');
      track('shown');
    } catch (e) { /* Play 로 깐 앱이 아니면 여기로 온다 */ }
  }

  async function accept() {
    track('accept');
    try {
      await Plug.startFlexible();
      set('downloading');
    } catch (e) { set('none'); }
  }
  function later() {
    track('dismiss');
    try { localStorage.setItem(KEY, today()); } catch (e) { /* 막혀 있어도 이번엔 닫힌다 */ }
    set('none');
  }
  async function install() {
    track('install');
    try { await Plug.complete(); } catch (e) { /* 실패하면 다음에 켤 때 다시 묻는다 */ }
  }

  window.Update = { check, isNative: native, state: () => state };
  if (!native || !Plug) return;

  document.addEventListener('DOMContentLoaded', paint);
  $('updateGo').addEventListener('click', () => (state === 'ready' ? install() : accept()));
  $('updateLater').addEventListener('click', later);

  Plug.addListener('state', (e) => {
    if (e.status === 'downloaded') { set('ready'); track('downloaded'); }
    else if (e.status === 'downloading') set('downloading');
    else if (e.status === 'failed' || e.status === 'canceled') set('available');
  });

  // Play 확인 창에서 취소하고 돌아오면 띠를 되돌린다
  if (App) App.addListener('resume', () => { if (state !== 'ready' && state !== 'downloading') check(); });

  setTimeout(check, 1200);   // 첫 화면이 뜬 뒤에 묻는다
})();
