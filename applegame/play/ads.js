// AdMob interstitials for the Android app (Capacitor) only. On the website and in OneStore there is no
// native AdMob plugin, so window.adBreak just starts the next game.
//
// The ad unit below is empty, so the app runs Google's test interstitial. Before the release build, create
// an app and an interstitial unit for 사과 게임 in the AdMob console (mobsgamez@gmail.com), put the unit in
// REAL_INTERSTITIAL and the app ID in android/app/src/main/AndroidManifest.xml.
(function () {
  const cap = window.Capacitor;
  const AdMob = cap && cap.isNativePlatform && cap.isNativePlatform() && cap.Plugins && cap.Plugins.AdMob;

  const TEST_INTERSTITIAL = 'ca-app-pub-3940256099942544/1033173712';
  const REAL_INTERSTITIAL = '';
  const isTesting = !REAL_INTERSTITIAL;
  const adId = REAL_INTERSTITIAL || TEST_INTERSTITIAL;
  // the developer's phone: real units still show test ads there (same phone as sudoku/minesweeper)
  const TEST_DEVICES = ['387406342BF322C05D510AC344240955'];

  const EVERY = 2;       // finished games between ads
  const GAP = 90 * 1000; // and at least this long since the last one

  let finished = 0;
  let lastShown = Date.now(); // no ad in the first minute and a half
  let starting = null;
  let loading = null;

  const timeout = (ms, value) => new Promise(r => setTimeout(() => r(value), ms));

  // consent (UMP) first: in the EEA/UK Google blocks ads shown without it
  function init() {
    if (!starting) {
      starting = (async () => {
        try {
          let info = await AdMob.requestConsentInfo();
          if (info.isConsentFormAvailable && info.status === 'REQUIRED') info = await AdMob.showConsentForm();
          if (info.canRequestAds === false) return false;
        } catch (e) { /* offline: let the SDK use the consent it already has */ }
        try {
          await AdMob.initialize({ testingDevices: TEST_DEVICES, initializeForTesting: true });
          return true;
        } catch (e) {
          starting = null;
          return false;
        }
      })();
    }
    return starting;
  }

  function prepare() {
    if (!loading) {
      const job = (async () => {
        if (!(await init())) return false;
        await AdMob.prepareInterstitial({ adId, isTesting });
        return true;
      })().catch(() => false);
      loading = job;
      job.then(ok => { if (!ok && loading === job) loading = null; });
    }
    return loading;
  }

  // Called when the player starts another game. gameFinished says the last game reached its end.
  // The new board is drawn right away behind the ad; its clock only starts on the first drag.
  window.adBreak = async function (gameFinished, next) {
    if (!AdMob) return next();
    if (gameFinished) finished++;
    if (finished < EVERY || Date.now() - lastShown < GAP) return next();
    const ok = await Promise.race([prepare(), timeout(1500, false)]);
    if (!ok) return next();
    finished = 0;
    lastShown = Date.now();
    loading = null;
    AdMob.showInterstitial().catch(() => {}).finally(() => prepare());
    next();
  };

  if (AdMob) setTimeout(prepare, 4000);
})();
