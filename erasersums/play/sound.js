/* 지우개 셈 — 효과음
 *
 * 2026-10-16 부터 ElevenLabs 로 만든 소리 파일(sfx/<이름>.mp3, scripts/sfx-elevenlabs.py)을 튼다.
 * 18개 합쳐 92KB. 파일 크기가 곧 소리끼리의 위계라(스크립트 LOUD 표) 여기서는 볼륨을 따로 안 준다.
 * 연달아 맞히면 음을 올리는 것은 재생 속도로(playbackRate). 파일을 아직 못 읽었거나 못 읽으면
 * 예전처럼 그 자리에서 합성한다(아래 tone·noise) — 첫 소리 몇 개, 또는 파일이 없는 환경.
 *
 * 소리결은 '공책과 연필' — 지우개는 스윽(잡음), 동그라미·줄 완성은 맑은 음, 종이는 사락.
 *
 * 두 가지를 지킨다.
 *   1. 설정 '소리' 를 끄면 여기서 막는다. 소리를 내는 곳마다 따로 살피지 않는다.
 *   2. 광고가 덮고 있는 동안(Ads.busy)에는 내지 않는다 — 광고는 웹뷰를 안 가려서
 *      visibilitychange 가 안 온다(webview-ads 문서 1). 소리가 겹치면 광고가 망가진 줄 안다.
 *
 * 쓰기: Sfx('circle'), Sfx('line', 240, 2)  — 두 번째는 몇 ms 뒤, 세 번째는 몇 번째 것인가(음이 올라간다).
 */
(function () {
  'use strict';
  const St = window.Store;
  let ac = null, noiseBuf = null;

  function ctx() {
    if (!St || !St.d.sound || (window.Ads && window.Ads.busy)) return null;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      load();
      return ac;
    } catch (e) { return null; }
  }

  // ── 소리 파일 ──
  const FILES = ['erase', 'circle', 'line', 'region', 'bad', 'heart', 'hint', 'win', 'star', 'lose', 'level',
    'tool', 'tap', 'open', 'close', 'page', 'deny', 'stamp'];
  const buf = {};
  let loading = false;
  function load() {
    if (loading || !ac) return;
    loading = true;
    for (const n of FILES) {
      fetch(`sfx/${n}.mp3`).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
        .then((data) => new Promise((ok, no) => ac.decodeAudioData(data, ok, no)))
        .then((b) => { buf[n] = b; })
        .catch(() => { /* 없으면 합성으로 */ });
    }
  }
  /** 파일 소리. rate 로 음 높이를 바꾼다. 파일이 없으면 false */
  function file(name, at, rate) {
    const b = buf[name];
    const a = b && ctx();
    if (!a) return false;
    const src = a.createBufferSource();
    src.buffer = b;
    src.playbackRate.value = rate || 1;
    src.connect(a.destination);
    src.start(a.currentTime + (at || 0));
    return true;
  }
  // 첫 소리부터 파일로 나게, 처음 손가락이 닿을 때 미리 받아 둔다(소리 상자는 사람이 눌러야 열린다)
  document.addEventListener('pointerdown', function first() {
    document.removeEventListener('pointerdown', first, true);
    ctx();
  }, true);

  const rnd = (a, b) => a + Math.random() * (b - a);
  /** 반음 n 칸 올린 소리 높이 */
  const semi = (hz, n) => hz * Math.pow(2, n / 12);

  /** 음 하나. slide 를 주면 그 높이로 미끄러진다. */
  function tone(freq, dur, o) {
    const a = ctx(); if (!a) return;
    const t = a.currentTime + (o.at || 0);
    const osc = a.createOscillator(), g = a.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.gain || 0.05, t + (o.attack || 0.012));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(a.destination);
    osc.start(t); osc.stop(t + dur + 0.03);
  }

  /** 잡음 한 자락. 거름망 높이를 f0 에서 f1 로 옮겨 '스윽·사락·쿵' 을 만든다. */
  function noise(dur, o) {
    const a = ctx(); if (!a) return;
    if (!noiseBuf) {
      noiseBuf = a.createBuffer(1, Math.floor(a.sampleRate * 0.4), a.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = a.currentTime + (o.at || 0);
    const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    src.buffer = noiseBuf;
    src.playbackRate.value = o.rate || 1;
    f.type = o.filter || 'bandpass';
    f.Q.value = o.q === undefined ? 0.9 : o.q;
    f.frequency.setValueAtTime(o.f0, t);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.gain || 0.1, t + (o.attack || 0.02));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(a.destination);
    src.start(t); src.stop(t + dur + 0.05);
  }

  // ── 연달아 맞히면 음이 한 칸씩 올라간다 ──────────────
  // 같은 소리가 스무 번 나면 지겹다. 5음 음계(도 레 미 솔 라)라 아무 데서 끊겨도 어울린다.
  const LADDER = [0, 2, 4, 7, 9, 12, 14, 16, 19];
  const GAP = 1600;   // 이만큼 쉬면 처음 음으로 돌아간다
  let streak = 0, streakAt = 0;
  function step() {
    const now = performance.now();
    streak = now - streakAt < GAP ? Math.min(streak + 1, LADDER.length - 1) : 0;
    streakAt = now;
    return LADDER[streak];
  }

  // 파일로 틀 때 음 높이(재생 속도). 연달아 맞히는 사다리는 반만 올린다 — 파일 소리는 많이 빠르게 틀면 장난감처럼 된다
  const rateOf = (semis) => Math.pow(2, semis / 12);
  function playFile(name, at, k) {
    switch (name) {
      case 'erase': return file(name, at, rateOf(step() * 0.35 + rnd(-0.3, 0.3)));
      case 'circle': return file(name, at, rateOf(step() / 2));
      case 'line': case 'region': return file(name, at, rateOf(k * 3));
      case 'star': return file(name, at, rateOf(k * 2));
      case 'bad': { const ok = file(name, at, 1); if (ok) streak = 0; return ok; }
      default: return file(name, at, 1);
    }
  }

  function play(name, atMs, i) {
    if (!St || !St.d.sound) return;
    const at = (atMs || 0) / 1000;
    const k = i || 0;
    if (playFile(name, at, k)) return;
    switch (name) {
      // 판 ─────────────────────────────────────────────
      case 'erase':   // 지우개 스윽. 연달아 지우면 조금씩 높아지고, 매번 살짝 다르다.
        noise(rnd(0.13, 0.17), { f0: 1500 + step() * 70 + rnd(-80, 80), f1: 900, q: 0.9, gain: 0.15, at });
        break;
      case 'circle':  // 연필로 동그라미
        { const s = step(); tone(semi(660, s), 0.1, { type: 'triangle', gain: 0.05, at, slide: semi(990, s) }); }
        break;
      case 'line':    // 가로·세로줄 완성 (한 번에 여러 줄이면 i 만큼 올라간다)
        tone(semi(660, k * 3), 0.12, { gain: 0.05, at });
        tone(semi(990, k * 3), 0.18, { gain: 0.05, at: at + 0.09 });
        break;
      case 'region':  // 색깔 묶음 완성 — 줄보다 둥글게, 두 음을 겹친다
        tone(semi(523, k * 3), 0.2, { type: 'triangle', gain: 0.045, at });
        tone(semi(659, k * 3), 0.24, { type: 'triangle', gain: 0.04, at: at + 0.05 });
        tone(semi(1047, k * 3), 0.2, { type: 'sine', gain: 0.025, at: at + 0.1 });
        break;
      case 'bad':
        tone(190, 0.24, { type: 'square', gain: 0.03, at, slide: 110 });
        streak = 0;   // 틀리면 사다리를 처음부터
        break;
      case 'heart':   // 하트 하나가 깨진다 — 낮게 쿵
        noise(0.18, { f0: 500, f1: 120, filter: 'lowpass', q: 1.2, gain: 0.12, at });
        tone(150, 0.22, { type: 'sine', gain: 0.05, at: at + 0.02, slide: 80 });
        break;
      case 'hint':
        tone(1175, 0.12, { gain: 0.04, at });
        tone(1568, 0.16, { gain: 0.035, at: at + 0.08 });
        break;
      case 'win':     // 다 풀었다 — 올라가는 네 음 + 반짝 + 종이 넘기는 사락
        [523, 659, 784, 1047].forEach((f, n) => tone(f, 0.24, { type: 'triangle', gain: 0.05, at: at + n * 0.09 }));
        tone(2093, 0.5, { type: 'sine', gain: 0.02, at: at + 0.38 });
        noise(0.3, { f0: 2600, f1: 900, gain: 0.05, at: at + 0.3 });
        break;
      case 'star':    // 별 하나 — 반짝
        tone(semi(1760, k * 2), 0.16, { type: 'triangle', gain: 0.035, at });
        tone(semi(2637, k * 2), 0.22, { type: 'sine', gain: 0.022, at: at + 0.05 });
        break;
      case 'lose':    // 하트를 다 썼다 — 내려가는 네 음
        [523, 440, 349, 262].forEach((f, n) => tone(f, 0.3, { type: 'triangle', gain: 0.045, at: at + n * 0.13 }));
        break;
      case 'level':   // 장 완료·보상 — 짧은 팡파르
        [392, 523, 659].forEach((f, n) => tone(f, 0.18, { type: 'triangle', gain: 0.05, at: at + n * 0.08 }));
        [784, 988, 1175].forEach((f) => tone(f, 0.5, { type: 'triangle', gain: 0.035, at: at + 0.26 }));
        break;

      // 손놀림 ──────────────────────────────────────────
      case 'tool':    // 지우기 ↔ 남기기
        noise(0.05, { f0: 2600, filter: 'highpass', q: 0.6, gain: 0.05, at });
        tone(1320, 0.05, { type: 'triangle', gain: 0.025, at });
        break;
      case 'tap':     // 버튼·탭 — 아주 짧고 작게
        tone(880, 0.05, { type: 'sine', gain: 0.03, at, slide: 1100 });
        break;
      case 'open':    // 창·지도가 올라온다
        noise(0.22, { f0: 420, f1: 2400, q: 0.7, gain: 0.05, at });
        break;
      case 'close':
        noise(0.18, { f0: 2200, f1: 500, q: 0.7, gain: 0.035, at });
        break;
      case 'page':    // 새 판 — 공책 한 장 넘기는 소리
        noise(0.24, { f0: 2400, f1: 800, q: 0.5, gain: 0.07, at, rate: 1.2 });
        break;
      case 'deny':    // 잠긴 곳·안 되는 것
        tone(160, 0.1, { type: 'square', gain: 0.03, at });
        tone(160, 0.1, { type: 'square', gain: 0.03, at: at + 0.14 });
        break;
      case 'stamp':   // 도장 쿵
        noise(0.14, { f0: 900, f1: 90, filter: 'lowpass', q: 1, gain: 0.16, at });
        tone(110, 0.16, { type: 'sine', gain: 0.05, at: at + 0.01, slide: 70 });
        break;
      default:
        break;
    }
  }

  play.reset = () => { streak = 0; };
  window.Sfx = play;
})();
