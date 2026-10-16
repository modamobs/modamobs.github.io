/* 지우개 셈 — 친구 초대 (토스 링크로 같은 판 보내기. 클래식 스도쿠 src/share/* 를 옮김)
 *
 * 판마다 도전 코드(E6-XXXX)가 있다. 그 코드를 토스 공유 링크(intoss://eraser-sums?c=코드)에 실어 보내면,
 * 받은 사람이 누르는 순간 토스가 열리고 **그 판이 바로 시작**된다(새 게임 판으로).
 *
 *   토스     토스 공유창 + 토스 링크. 다리(toss/bridge)의 Toss.invite
 *   웹       navigator.share 가 있으면 그것(주소 ?c=코드), 개발 중 확인용
 *   안드로이드 아직 없다 — 공유 플러그인이 없다. 판 설정의 도전 코드 복사로 대신한다
 *
 * 보내는 자리: 판을 깬 창(새 게임·하트 없이·데일리), 판 안 설정 창.
 * 데일리 판도 씨앗이 정해져 있어 같은 코드로 같은 판이 열린다.
 */
(function () {
  'use strict';
  const St = window.Store;
  const Toss = window.Toss && window.Toss.inToss ? window.Toss : null;
  const web = !Toss && !(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) &&
    typeof navigator !== 'undefined' && !!navigator.share && location.protocol.startsWith('http');
  const available = !!((Toss && Toss.invite && Toss.invite.available) || web);

  async function linkFor(code) {
    if (Toss) return Toss.invite.link(code);
    return `${location.origin}${location.pathname}?c=${encodeURIComponent(code)}`;
  }

  /** 판 하나를 보낸다. won = { t: '1:23', m: 0 } 이면 깬 판 자랑 글 */
  async function send(n, seed, won, where) {
    const code = St.codeOf(n, seed);
    const link = await linkFor(code);
    const text = won
      ? T('share.won', { n, t: won.t, m: won.m, c: code, link })
      : T('share.board', { n, c: code, link });
    let ok = false;
    try {
      if (Toss) ok = await Toss.invite.send(text);
      else { await navigator.share({ text }); ok = true; }
    } catch (e) { ok = false; }
    if (window.Track) window.Track('share_sent', { where, n, ok: ok ? 1 : 0 });
    if (!ok && window.Game) window.Game.toast(T('share.fail'));
  }

  // 공유 링크로 열렸으면 그 판으로 바로 들어간다. 켤 때 한 번만
  function launch() {
    let code = null;
    if (Toss) code = Toss.invite.launchCode();
    else { try { code = new URLSearchParams(location.search).get('c'); } catch (e) { code = null; } }
    const c = code && St.parseCode(code);
    if (!c || !window.Game) return;
    if (window.Track) window.Track('share_open', { n: c.n });
    window.Game.start({ mode: 'free', n: c.n, seed: c.seed });
    setTimeout(() => window.Game.toast(T('share.opened')), 700);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(launch, 0));
  else setTimeout(launch, 0);

  window.Invite = { available, send };
})();
