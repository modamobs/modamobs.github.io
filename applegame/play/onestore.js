// ONE store H5 Game SDK (web game). Only the OneStore page loads this file (see scripts/build-onestore.py);
// the game itself is the same www/index.html, reached through window.AppleGame.
// Flow per the official guide: listeners first, then initializeAsync → setLoadingProgress → startGameAsync.
// In a normal browser initializeAsync resolves with `err`, and the game simply runs without the SDK.
import { createSDK } from 'https://h5sdk.onestore.net/lib/v1.1.0/onestore-h5-sdk.min.js';

const sdk = createSDK();
const game = () => window.AppleGame; // defined by the classic script in index.html, which runs before this module

// Interstitial 상용 ID from ONEconsole > 사과 게임 > 수익화 > 인앱 광고 (a rewarded ID exists too, unused). The web
// game's 기본정보 must also say 광고 적용 여부: 예. Emptied, the ONE store app shows no ads.
const INTERSTITIAL_ID = 'xWUGF-24GF-GC2S-49NT';

sdk.on('pause', () => game()?.pause());
sdk.on('resume', e => {
  if (e && typeof e.ringerSilent === 'boolean') game()?.setSilent(e.ringerSilent);
  game()?.resume();
});
// settings and scores are written to localStorage as they change, so there is nothing left to save on exit
sdk.on('exit', () => {});
sdk.onBackPressed(() => game()?.back() ?? false); // must stay synchronous

sdk.initializeAsync()
  .then(info => {
    if (info.err) return; // not inside the ONE store app: play without it
    if (typeof info.ringerSilent === 'boolean') game()?.setSilent(info.ringerSilent);
    if (info.safeArea) {
      const root = document.documentElement.style;
      root.setProperty('--safe-top', info.safeArea.top + 'px');
      root.setProperty('--safe-bottom', info.safeArea.bottom + 'px');
    }
    // the page and its art are already loaded; the board is drawn as soon as the script runs
    sdk.setLoadingProgress(100);
    return sdk.startGameAsync().then(startAds);
  })
  .catch(e => console.warn('ONE store SDK', e && e.reason, e && e.message));

// isSupported is only right after init, so this runs once the game has started. ads.js decides when to show:
// the same rule as the Android app. Failures (no_fill included) come back as status 'failed' and the game goes on;
// the SDK fires pause/resume around the ad by itself.
function startAds() {
  if (!INTERSTITIAL_ID || !sdk.ads.isSupported('interstitial')) return;
  const load = () => sdk.ads.loadInterstitial({ placementId: INTERSTITIAL_ID }); // loading twice is ignored
  load();
  window.oneStoreInterstitial = () =>
    sdk.ads.showInterstitialAsync({ placementId: INTERSTITIAL_ID }).catch(() => {}).finally(load);
}
