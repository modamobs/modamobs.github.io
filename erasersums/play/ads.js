/* 지우개 셈 — 광고 (안드로이드 AdMob)
 *
 * 웹(아티팩트 링크)에서는 아무것도 하지 않는다. 캐패시터 앱에서만 돈다.
 * 토스 미니앱에서는 토스 광고로 간다 — 다리(toss/bridge/ads.js)가 내놓는 window.Toss.ads 를 부른다(아래 tossAds).
 *
 * 문서(webview-ads)에서 되풀이된 함정을 여기서 한 번에 막는다:
 *   1. 광고는 웹뷰를 가리지 않는다 → visibilitychange 가 안 온다.
 *      그래서 광고를 띄우는 이 자리에서 소리를 줄이고(Ads.busy) 판 시간을 멈춘다(Game.pause).
 *   2. 미리 불러 둔다. 보여준 뒤 곧바로 다음 편을 잡는다.
 *   3. 보상은 '끝까지 봤다'(Rewarded)에서만. 리스너는 한 편마다 달고 끝나면 지운다.
 *      단, 화면은 Dismissed 에서 돌아온다 — 그 전에는 광고가 아직 덮고 있다.
 *   4. 배너 높이는 --ad-h 로 흘려보내고, 화면 아래 여백은 배너 + 내비게이션 바로 잡는다.
 *      배너는 판 화면에서만 띄운다 — 홈은 카드가 빽빽해서 배너까지 깔면 눌린다(Ads.banner).
 */
(function () {
  'use strict';

  // 구글 테스트 광고 단위
  const TEST = {
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
  };
  // 진짜 광고 단위 (애드몹 '지우개 셈' — 앱 ID 는 매니페스트에 있다)
  const REAL = {
    banner: 'ca-app-pub-3012351240086302/7138603420',
    interstitial: 'ca-app-pub-3012351240086302/5633950062',
    rewarded: 'ca-app-pub-3012351240086302/5035184269',
  };
  // 실제 단위를 쓴다. 내 기기는 아래 DEV_DEVICES 에 들어 있어 여기서도 테스트 광고만 뜬다 —
  // 아는 사람이 진짜 광고를 누르면 무효 트래픽으로 잡혀 계정이 위험해진다.
  const UNITS = REAL;
  const TESTING = UNITS === TEST;
  // 진짜 단위를 쓰면서도 내 기기에서는 테스트 광고를 보려면 여기에 기기 해시를 넣는다.
  // 해시는 앱을 켤 때 로그캣에 찍힌다: "Use RequestConfiguration.Builder.setTestDeviceIds(...)"
  const DEV_DEVICES = ['387406342BF322C05D510AC344240955'];   // 개발용 갤럭시

  const cap = window.Capacitor;
  const native = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  // 번들러 없이 쓰면 capacitor 런타임이 registerPlugin 없이 올 때가 있다 → 플러그인 프록시로도 잡는다
  const AdMob = !native ? null
    : (cap.registerPlugin ? cap.registerPlugin('AdMob') : (cap.Plugins && cap.Plugins.AdMob) || null);

  // 판 수는 맨 앞에 — 웹·플러그인 없음에서 아래 return 으로 빠져도 noteWin 이 부를 수 있게(TDZ)
  let lastInterstitial = 0, winsSince = 0;
  const Ads = {
    busy: false,        // 광고가 화면을 덮고 있는 동안 true (소리·시간 멈춤)
    ready: false,
    isNative: native,
    rewarded, interstitial, maybeInterstitial, banner,
    noteWin() { winsSince++; },
  };
  window.Ads = Ads;

  // 토스 미니앱 — 토스 광고. 다리(toss_bridge.js)는 토스 번들에만 실린다.
  const Toss = window.Toss && window.Toss.inToss ? window.Toss : null;
  if (Toss) { tossAds(Toss.ads); return; }

  if (!native) return;
  if (!AdMob) { console.warn('광고 플러그인을 못 찾음'); Ads.isNative = false; return; }

  const root = document.documentElement;
  // 앱에서는 우리가 직접 가장자리를 비운다 (웹 아티팩트에서는 게시 틀이 해 준다)
  root.style.setProperty('--safe-top', 'env(safe-area-inset-top)');
  root.style.setProperty('--app-bottom', 'env(safe-area-inset-bottom)');

  const loaded = { interstitial: null, rewarded: null };
  let bannerOn = false, bannerMade = false, bannerH = '0px';

  async function init() {
    try {
      // 플러그인은 initializeForTesting 이 true 일 때만 testingDevices 를 읽는다(AdMob.java setRequestConfiguration).
      // 그래서 실제 단위를 쓸 때도 켜 둔다 — 목록에 든 내 기기만 테스트 광고를 받고, 다른 사람에게는 진짜 광고가 나간다.
      await AdMob.initialize({ initializeForTesting: TESTING || DEV_DEVICES.length > 0, testingDevices: DEV_DEVICES });
      Ads.ready = true;
      console.log('광고 시작됨');
      AdMob.addListener('bannerAdSizeChanged', (size) => {
        // 0 은 무시한다(배너를 내릴 때만 우리가 직접 0 으로 둔다)
        if (!size || !size.height) return;
        bannerH = `${size.height}px`;
        if (bannerOn) root.style.setProperty('--ad-h', bannerH);
      });
      prime('interstitial');
      prime('rewarded');
    } catch (e) {
      console.warn('광고 시작 못 함', e);
    }
  }

  // 미리 불러 두기. 실패한 것은 들고 있지 않는다.
  function prime(kind) {
    if (loaded[kind]) return loaded[kind];
    const job = (kind === 'interstitial'
      ? AdMob.prepareInterstitial({ adId: UNITS.interstitial, isTesting: TESTING })
      : AdMob.prepareRewardVideoAd({ adId: UNITS.rewarded, isTesting: TESTING })
    ).then(() => true).catch(() => false);
    loaded[kind] = job;
    job.then((ok) => { if (!ok) loaded[kind] = null; });
    return job;
  }

  /** 배너 켜고 끄기. 판 화면에서만 켠다 — 홈은 배너 자리를 빼고 꽉 차 있다.
   *  첫 번째만 새로 띄우고 그 뒤로는 감췄다 되돌린다(다시 불러오지 않는다). */
  async function banner(on) {
    on = !!on;
    if (!Ads.ready || on === bannerOn) return;
    bannerOn = on;
    try {
      if (on) {
        if (bannerMade) { await AdMob.resumeBanner(); root.style.setProperty('--ad-h', bannerH); }
        else { bannerMade = true; await AdMob.showBanner({ adId: UNITS.banner, position: 'BOTTOM_CENTER', margin: 0, isTesting: TESTING }); }
      } else {
        root.style.setProperty('--ad-h', '0px');
        await AdMob.hideBanner();
      }
    } catch (e) {
      // 못 띄웠으면 없는 셈 친다(자리도 비운다)
      if (on) { bannerOn = false; root.style.setProperty('--ad-h', '0px'); }
    }
  }

  /** 약속이 안 풀릴 때를 대비한 시간 제한. 이벤트를 한 번 놓쳤다고 게임이 멎으면 안 된다. */
  const guard = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);

  // 광고가 덮고 있는 동안 소리를 줄이고 판 시간을 멈춘다
  async function quiet(run) {
    Ads.busy = true;
    if (window.Game && window.Game.pause) window.Game.pause();
    try {
      return await run();
    } finally {
      Ads.busy = false;
      if (window.Game && window.Game.resume) window.Game.resume();
    }
  }

  /** 보상형. 끝까지 본 사람만 true, 안 보고 닫으면 false, **띄울 광고가 없으면 null**.
   *  셋을 가르는 까닭: 광고가 없는데 "끝까지 봐야 해요" 라고 하면 거짓말이 된다. */
  function rewarded() {
    return quiet(async () => {
      if (!Ads.ready || !(await prime('rewarded'))) return null;
      loaded.rewarded = null;
      let earned = false;
      const subs = [];
      const done = new Promise((resolve) => {
        subs.push(AdMob.addListener('onRewardedVideoAdReward', () => { earned = true; }));
        subs.push(AdMob.addListener('onRewardedVideoAdDismissed', () => resolve()));
        subs.push(AdMob.addListener('onRewardedVideoAdFailedToShow', () => resolve()));
      });
      try {
        await AdMob.showRewardVideoAd();
        await guard(done, 90000);   // 보상은 Rewarded 에서, 화면 복귀는 Dismissed 에서
      } catch (e) {
        /* 못 띄웠으면 보상 없음 */
      }
      for (const s of subs) (await s).remove();
      prime('rewarded');      // 다음 편 미리
      if (window.Track) window.Track('ad_rewarded', { earned: earned ? 1 : 0 });
      return earned;
    });
  }

  /** 전면. 준비된 게 없으면 조용히 넘어간다. */
  function interstitial() {
    return quiet(async () => {
      if (!Ads.ready || !(await prime('interstitial'))) return;
      loaded.interstitial = null;
      const subs = [];
      // 전면 이벤트에는 on 접두사가 없다(보상형만 onRewardedVideoAd…). 이름이 틀리면 광고를 닫아도
      // 이 약속이 안 풀려서 다음 판으로 넘어가지 못한다 — 2026-09-23 여정에서 그렇게 멈췄다.
      const done = new Promise((resolve) => {
        subs.push(AdMob.addListener('interstitialAdDismissed', () => resolve()));
        subs.push(AdMob.addListener('interstitialAdFailedToShow', () => resolve()));
      });
      try {
        await AdMob.showInterstitial();
        await guard(done, 25000);   // 이벤트를 놓쳐도 게임이 멎지 않게
      } catch (e) { /* 넘어간다 */ }
      for (const s of subs) (await s).remove();
      lastInterstitial = Date.now();
      if (window.Track) window.Track('ad_interstitial', {});
      prime('interstitial');
      return undefined;
    });
  }

  /** 결과 창을 떠날 때: 깬 판(noteWin)이 셋 쌓였고 앞 광고에서 1분은 지났으면.
   *  다음 판·홈·지도 어느 쪽으로 나가도 센다 — 「한 판 더」만 세면 홈을 거쳐 시작하는 사람은 거의 안 봤다(2026-10-08) */
  function maybeInterstitial() {
    if (winsSince < 3 || Date.now() - lastInterstitial < 60000) return Promise.resolve();
    winsSince = 0;
    return interstitial();
  }

  /** 토스 광고. 함정은 안드로이드와 같다(소리·시간 멈춤, 세 판에 한 번 전면).
   *  다른 점: 배너가 웹뷰 **안에** 그려진다 — 판 화면 아래에 자리(#tossBanner)를 만들어 붙인다.
   *  96px 자리에 광고는 80px 쯤으로 가운데 그려지므로 자리 전체를 흰색으로 칠하고 화면 끝에 붙인다. */
  function tossAds(T) {
    const root = document.documentElement;
    const SLOT_H = 96;
    // 보상형 지면이 없으면(시험 번들) 웹처럼 힌트를 바로 준다
    Ads.isNative = T.hasReward;
    Ads.ready = true;
    T.init().then(() => T.preload());

    let slot = null, detach = null;
    Ads.banner = function (on) {
      if (!T.hasBanner) return;
      if (on) {
        if (detach) return;
        if (!slot) {
          slot = document.createElement('div');
          slot.id = 'tossBanner';
          slot.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:5;background:#fff;height:' +
            `calc(${SLOT_H}px + var(--app-bottom))` + ';padding-bottom:var(--app-bottom);box-sizing:border-box';
          document.body.appendChild(slot);
        }
        slot.hidden = false;
        root.style.setProperty('--ad-h', `${SLOT_H}px`);
        const inner = document.createElement('div');
        inner.style.cssText = `width:100%;height:${SLOT_H}px`;
        slot.replaceChildren(inner);
        detach = T.attachBanner(inner, (filled) => {
          // 광고가 없으면 자리도 비운다 — 빈 흰 띠가 판을 가리면 안 된다
          if (!filled && detach) { Ads.banner(false); }
        }, false);
      } else {
        if (detach) { detach(); detach = null; }
        if (slot) { slot.hidden = true; slot.replaceChildren(); }
        root.style.setProperty('--ad-h', '0px');
      }
    };

    const quietly = (run) => async function () {
      Ads.busy = true;
      if (window.Game && window.Game.pause) window.Game.pause();
      try { return await run(); } finally {
        Ads.busy = false;
        if (window.Game && window.Game.resume) window.Game.resume();
      }
    };
    let last = 0, wins = 0;
    Ads.rewarded = quietly(async () => {
      const got = await T.showReward();
      if (window.Track) window.Track('ad_rewarded', { earned: got ? 1 : 0 });
      return got;
    });
    Ads.interstitial = quietly(async () => {
      const shown = await T.showInterstitial();
      if (shown) { last = Date.now(); if (window.Track) window.Track('ad_interstitial', {}); }
    });
    Ads.noteWin = function () { wins++; };
    Ads.maybeInterstitial = function () {
      if (wins < 3 || Date.now() - last < 60000) return Promise.resolve();
      wins = 0;
      return Ads.interstitial();
    };
  }

  // 캐패시터 플러그인은 웹뷰가 뜬 뒤에 붙는다. 한 번만 시작하고, 늦게 붙는 경우를 위해 조금 기다린다.
  let started = false;
  const start = () => { if (!started) { started = true; init(); } };
  document.addEventListener('deviceready', start, { once: true });
  setTimeout(start, 600);
})();
