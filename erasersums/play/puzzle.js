/* 지우개 셈 — 판 만들기·풀이기 (화면과 무관, 노드에서도 돈다)
 *
 * 칸 상태: 0 모름, 1 남김(동그라미), 2 지움
 * 판: { level, n, nums[n*n], keep[n*n], rows[n], cols[n], lines[] }
 *
 * 만들 때 "줄 하나만 보고 하는 추리" 로 끝까지 풀리는 판만 낸다.
 * 이 추리는 틀릴 수 없으므로 끝까지 풀리면 답은 하나뿐이고, 찍지 않고 풀린다.
 */
(function (root) {
  'use strict';

  function mulberry32(a) {
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function seedOf(level, attempt) {
    let h = 2166136261 ^ level;
    h = Math.imul(h, 16777619) ^ attempt;
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995);
    return (h ^ (h >>> 15)) >>> 0;
  }

  // 단계(레벨)마다 판 크기 — 스도쿠 여정과 같은 짜임. 장 = 10단계.
  //   1~3단계는 규칙 익히기(3×3, 4×4, 4×4).
  //   장마다 기본 크기가 있고 두 장씩 오른다: 1·2장 5×5, 3·4장 6×6, 5·6장 7×7, 7·8장 8×8, 9장부터 9×9.
  //   장 안: 1·4·7번째는 쉬어 가는 판(한 칸 작게), 10번째 마무리는 한 칸 크게.
  function sizeFor(level) {
    if (level <= 1) return 3;
    if (level <= 3) return 4;
    const ch = Math.ceil(level / 10) - 1;
    const k = (level - 1) % 10;
    const base = Math.min(9, 5 + Math.floor(ch / 2));
    if (k === 9) return Math.min(9, base + 1);
    if (k % 3 === 0) return Math.max(4, base - 1);
    return base;
  }

  // 색깔 묶음은 6×6 판부터 — 모든 모드 같다. 5×5 까지는 가로·세로 합만으로 규칙을 익힌다.
  // (처음 묶음이 나오는 판에서 tutorial.js 가 묶음 안내를 한 번 띄운다. 여정에서는 10단계)
  const REGION_MIN = 6;

  // 줄 목록: 가로 n개, 세로 n개, 색깔 묶음 (있으면)
  function makeLines(n, rows, cols, groups) {
    const lines = [];
    for (let r = 0; r < n; r++) {
      const cells = [];
      for (let c = 0; c < n; c++) cells.push(r * n + c);
      lines.push({ kind: 'r', idx: r, cells, target: rows[r] });
    }
    for (let c = 0; c < n; c++) {
      const cells = [];
      for (let r = 0; r < n; r++) cells.push(r * n + c);
      lines.push({ kind: 'c', idx: c, cells, target: cols[c] });
    }
    if (groups) groups.forEach((g, i) => lines.push({ kind: 'g', idx: i, cells: g.cells, target: g.target }));
    return lines;
  }

  // 색깔 묶음 나누기: 씨앗 k개를 뿌리고, 넓힐 수 있는 묶음 중 가장 작은 것부터 한 칸씩 붙인다.
  // 그래서 묶음 크기가 고르다. 반환: 칸마다 묶음 번호, 묶음 수
  function makeRegions(n, rnd) {
    const N = n * n;
    const k = n <= 6 ? n : n <= 8 ? n + 1 : n + 2;
    const reg = new Int8Array(N).fill(-1);
    const size = new Array(k).fill(0);
    for (let g = 0; g < k; g++) {
      let c;
      do c = Math.floor(rnd() * N); while (reg[c] !== -1);
      reg[c] = g; size[g] = 1;
    }
    const cand = [];
    for (let left = N - k; left > 0; left--) {
      let minSize = Infinity;
      cand.length = 0;
      for (let c = 0; c < N; c++) {
        if (reg[c] !== -1) continue;
        const r = (c / n) | 0, col = c % n;
        const nb = [r > 0 ? c - n : -1, r < n - 1 ? c + n : -1, col > 0 ? c - 1 : -1, col < n - 1 ? c + 1 : -1];
        for (const x of nb) {
          if (x < 0 || reg[x] < 0) continue;
          const g = reg[x];
          if (size[g] < minSize) { minSize = size[g]; cand.length = 0; }
          if (size[g] === minSize) cand.push(c, g);
        }
      }
      const j = Math.floor(rnd() * (cand.length / 2)) * 2;
      reg[cand[j]] = cand[j + 1];
      size[cand[j + 1]]++;
    }
    return { reg, k, size };
  }

  // 이웃한 묶음끼리 다른 색 (8색 중에서). 8색은 색상환 순서라(index.html --r0..7) 이웃과 고리 위에서
  // 가장 먼 색을 고른다 — 같지만 않으면 되던 때는 파랑 옆에 보라처럼 비슷한 색이 붙어 묶음이 잘 안 갈렸다.
  // rnd 는 예전처럼 한 번만 부른다 — 뒤의 판 만들기가 같은 수열을 받아야 같은 코드·같은 날 퍼즐이 같은 판이다.
  function colorRegions(n, reg, k, rnd) {
    const adj = Array.from({ length: k }, () => new Set());
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const a = reg[r * n + c];
      if (c < n - 1 && reg[r * n + c + 1] !== a) { adj[a].add(reg[r * n + c + 1]); adj[reg[r * n + c + 1]].add(a); }
      if (r < n - 1 && reg[(r + 1) * n + c] !== a) { adj[a].add(reg[(r + 1) * n + c]); adj[reg[(r + 1) * n + c]].add(a); }
      // 모서리만 맞닿은 묶음도 이웃으로 친다 — 같은 색이면 대각선으로 이어진 한 묶음처럼 보인다
      for (const dc of [-1, 1]) {
        const b = r < n - 1 && c + dc >= 0 && c + dc < n ? reg[(r + 1) * n + c + dc] : a;
        if (b !== a) { adj[a].add(b); adj[b].add(a); }
      }
    }
    const color = new Array(k).fill(-1);
    const off = Math.floor(rnd() * 8);
    const dist = (a, b) => { const d = Math.abs(a - b); return Math.min(d, 8 - d); };
    for (let g = 0; g < k; g++) {
      const near = [...adj[g]].map((x) => color[x]).filter((c) => c >= 0);
      const start = (off + g * 3) % 8;
      let best = start, score = -1;
      for (let t = 0; t < 8; t++) {
        const c = (start + t) % 8;
        const d = near.length ? Math.min(...near.map((x) => dist(c, x))) : 4;
        // 거리가 먼저(세 칸 = 135° 넘게 떨어지면 충분하다고 본다), 같으면 판에 아직 없는 색 —
        // 떨어진 두 묶음이 같은 색이면 한 묶음처럼 보인다
        const s = Math.min(d, 3) * 2 + (color.includes(c) ? 0 : 1);
        if (s > score) { best = c; score = s; }
      }
      color[g] = best;
    }
    return color;
  }

  // 줄 하나에서 확정되는 칸들. 모순이면 null.
  // 남은 칸들의 부분집합 중 합이 맞는 것을 모두 보고,
  // 모든 경우에 들어가면 남김, 한 번도 안 들어가면 지움.
  function deduceLine(nums, state, line) {
    let base = 0;
    const free = [];
    for (const c of line.cells) {
      if (state[c] === 1) base += nums[c];
      else if (state[c] === 0) free.push(c);
    }
    const need = line.target - base;
    const k = free.length;
    if (k === 0) return need === 0 ? [] : null;
    if (need < 0) return null;
    const full = (1 << k) - 1;
    let andMask = full, orMask = 0, found = 0;
    for (let m = 0; m <= full; m++) {
      let s = 0;
      for (let i = 0; i < k; i++) if ((m >> i) & 1) s += nums[free[i]];
      if (s === need) { andMask &= m; orMask |= m; found++; }
    }
    if (!found) return null;
    const out = [];
    for (let i = 0; i < k; i++) {
      if ((andMask >> i) & 1) out.push([free[i], 1]);
      else if (!((orMask >> i) & 1)) out.push([free[i], 2]);
    }
    return out;
  }

  // 줄 추리를 더 나올 게 없을 때까지. rounds = 줄 전체를 몇 바퀴 돌았나(난이도 눈금)
  function solve(p, start) {
    const state = start ? Int8Array.from(start) : new Int8Array(p.n * p.n);
    let rounds = 0, changed = true;
    while (changed) {
      changed = false;
      rounds++;
      for (const line of p.lines) {
        const d = deduceLine(p.nums, state, line);
        if (d === null) return { ok: false, solved: false, state, rounds };
        for (const [c, v] of d) { state[c] = v; changed = true; }
      }
    }
    let solved = true;
    for (let i = 0; i < state.length; i++) if (state[i] === 0) { solved = false; break; }
    return { ok: true, solved, state, rounds };
  }

  // 레벨 판: 레벨 번호가 씨앗이라 누구에게나 같은 판
  function generate(level) {
    const n = sizeFor(level);
    const p = build(n, (a) => seedOf(level, a), '레벨 ' + level, n >= REGION_MIN);
    p.level = level;
    return p;
  }

  // 데일리·자유 게임 판: 씨앗과 크기로 (색깔 묶음 있음)
  function generateSeeded(seed, n, regions) {
    return build(n, (a) => seedOf((seed ^ 0x5bd1e995) >>> 0, a + 7919), '씨앗 ' + seed, regions !== false && n >= REGION_MIN);
  }

  function build(n, seedAt, tag, withRegions) {
    const N = n * n;
    for (let attempt = 0; attempt < 20000; attempt++) {
      const rnd = mulberry32(seedAt(attempt));
      const nums = new Int8Array(N);
      const keep = new Int8Array(N);
      for (let i = 0; i < N; i++) nums[i] = 1 + Math.floor(rnd() * 9);
      const ratio = 0.42 + rnd() * 0.16;
      for (let i = 0; i < N; i++) keep[i] = rnd() < ratio ? 1 : 0;

      // 줄마다 남길 칸과 지울 칸이 하나 이상
      let bad = false;
      const rows = new Array(n).fill(0), cols = new Array(n).fill(0);
      const rk = new Array(n).fill(0), ck = new Array(n).fill(0);
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const i = r * n + c;
        if (keep[i]) { rows[r] += nums[i]; cols[c] += nums[i]; rk[r]++; ck[c]++; }
      }
      for (let j = 0; j < n; j++) {
        if (rk[j] === 0 || rk[j] === n || ck[j] === 0 || ck[j] === n) { bad = true; break; }
      }
      if (bad) continue;

      // 색깔 묶음: 크기 3~10칸, 묶음마다 남길 칸이 하나 이상(합이 0인 묶음은 없다)
      let groups = null, region = null;
      if (withRegions) {
        const R = makeRegions(n, rnd);
        if (R.size.some((s) => s < 3 || s > 10)) continue;
        const color = colorRegions(n, R.reg, R.k, rnd);
        groups = Array.from({ length: R.k }, (_, g) => ({ cells: [], target: 0, color: color[g], anchor: -1 }));
        for (let i = 0; i < N; i++) {
          const g = groups[R.reg[i]];
          if (g.anchor < 0) g.anchor = i; // 읽는 순서로 첫 칸 = 왼쪽 위, 여기에 합을 적는다
          g.cells.push(i);
          if (keep[i]) g.target += nums[i];
        }
        if (groups.some((g) => g.target === 0)) continue;
        region = R.reg;
      }

      const p = { n, nums, keep, rows, cols, groups, region, lines: makeLines(n, rows, cols, groups) };
      const res = solve(p);
      if (!res.solved) continue;
      p.rounds = res.rounds;
      p.attempt = attempt;
      return p;
    }
    throw new Error('판을 못 만듦: ' + tag);
  }

  // 지금 상태에서 줄 하나로 확정되는 칸 하나. 지울 칸을 먼저 고른다.
  function findHint(p, state, rnd) {
    const r = rnd || Math.random;
    const erase = [], keep = [];
    const seen = new Set();
    for (const line of p.lines) {
      const d = deduceLine(p.nums, state, line);
      if (!d) continue;
      for (const [c, v] of d) {
        if (seen.has(c)) continue;
        seen.add(c);
        (v === 2 ? erase : keep).push({ cell: c, value: v, line });
      }
    }
    // 남길 숫자(동그라미)를 먼저 — 지워 주는 힌트보다 "답을 하나 알려 줬다" 로 느껴진다(2026-10-11).
    // 판 200개 중 199개는 처음부터 동그라미 힌트가 있다. 없을 때만 지우기
    const pool = keep.length ? keep : erase;
    if (!pool.length) return null;
    return pool[Math.floor(r() * pool.length)];
  }

  const api = { generate, generateSeeded, solve, findHint, deduceLine, sizeFor, makeLines, mulberry32, REGION_MIN };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CrossSum = api;
})(typeof window !== 'undefined' ? window : globalThis);
