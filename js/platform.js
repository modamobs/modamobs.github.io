/* ===================================================
   모브스 게임 플랫폼 — 로그인·데이터·업로드
   ---------------------------------------------------
   ES 모듈입니다. 불러오면 window.MobsPlatform 을 채우고
   "mobs-platform-ready" 이벤트를 쏩니다. (feed.js는 이 이벤트를 기다립니다)

   - 보는 사람: 익명 로그인 (좋아요·플레이 수·신고용, 가입 없이)
   - 올리는 사람: 구글 로그인 (익명 계정이 있으면 그 계정에 구글을 이어 붙여 좋아요를 유지)
   - 게임 파일: 업로드 Worker(PLAY_ORIGIN) → R2. zip은 브라우저에서 풉니다.
   - 게임 정보·카운터: Firestore games/{id}  (규칙: platform/firestore.rules)
   =================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInAnonymously, signOut as fbSignOut,
  GoogleAuthProvider, signInWithPopup, linkWithPopup
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  getFirestore, collection, query, where, orderBy, limit, getDocs, getDoc, doc,
  setDoc, updateDoc, deleteDoc, writeBatch, increment, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAT-5_Uo-lb_urCpo6i_0Sf72io5lzkr88",
  authDomain: "mobs-play-platform.firebaseapp.com",
  projectId: "mobs-play-platform",
  storageBucket: "mobs-play-platform.firebasestorage.app",
  messagingSenderId: "741887586115",
  appId: "1:741887586115:web:74f1561b5fc3f6129709f6"
};

/* 유저 게임이 실행되는 주소. 본 사이트와 반드시 달라야 합니다.
   로컬에서도 실제 서버를 씁니다. (게임 정보는 실제 Firestore에 저장되므로 파일도 실제 R2에 있어야 합니다)
   Worker 자체를 고치며 시험할 때만 콘솔에서 localStorage.playOrigin = "http://localhost:8787" */
const PLAY_ORIGIN = (function () {
  try {
    const dev = localStorage.getItem("playOrigin");
    if (dev && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(dev)) return dev;
  } catch (e) { /* 저장소 막힘 */ }
  return "https://mobs-play.matgo-cert.workers.dev";
})();

/* 신고가 이만큼 쌓이면 관리자가 확인(reviewed)하기 전까지 피드에서 숨깁니다. */
const REPORT_HIDE = 3;

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

/* ---------- 로그인 ---------- */

let user = null;
const userWaiters = [];
const listeners = [];
const firstAuth = new Promise(resolve => {
  const stop = onAuthStateChanged(auth, u => { stop(); resolve(u); });
});
onAuthStateChanged(auth, u => {
  user = u;
  listeners.forEach(fn => { try { fn(u); } catch (e) { console.error(e); } });
});

function isMember(u = user) { return !!u && !u.isAnonymous; }
function isAdmin(u = user) { return isMember(u) && u.email === "yamoda24@gmail.com" && u.emailVerified; }

/* 보는 사람: 로그인이 없으면 익명으로 */
async function ensureViewer() {
  await firstAuth;
  if (auth.currentUser) return auth.currentUser;
  const cred = await signInAnonymously(auth);
  return cred.user;
}

async function signInGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const cur = auth.currentUser;
  if (cur && cur.isAnonymous) {
    try {
      return (await linkWithPopup(cur, provider)).user;
    } catch (e) {
      // 이미 다른 기기에서 가입한 구글 계정이면 그냥 그 계정으로 들어갑니다.
      if (e.code !== "auth/credential-already-in-use" && e.code !== "auth/email-already-in-use") throw e;
    }
  }
  return (await signInWithPopup(auth, provider)).user;
}

async function signOut() { await fbSignOut(auth); }

function onUser(fn) { listeners.push(fn); fn(user); }

/* ---------- 읽기 ---------- */

function gameFromDoc(d) {
  const g = d.data();
  return {
    id: d.id,
    official: !!g.official,
    title: g.title || "",
    desc: g.desc || "",
    tags: g.tags || [],
    ownerUid: g.ownerUid || "",
    ownerName: g.ownerName || "",
    createdAt: g.createdAt ? g.createdAt.toMillis() : 0,
    thumb: g.thumb ? playUrl(d.id) + g.thumb : "",
    portrait: g.portrait !== false,
    likeCount: g.likeCount || 0,
    playCount: g.playCount || 0,
    reportCount: g.reportCount || 0,
    hidden: !!g.hidden,
    reviewed: !!g.reviewed,
    size: g.size || 0
  };
}

function visible(g) {
  return !g.hidden && (g.reviewed || g.reportCount < REPORT_HIDE);
}

/* 피드용: 유저 게임(최신 100개) + 공식 게임 카운터 */
async function loadFeed() {
  const [userSnap, officialSnap] = await Promise.all([
    getDocs(query(collection(db, "games"), where("hidden", "==", false), orderBy("createdAt", "desc"), limit(100))),
    getDocs(query(collection(db, "games"), where("official", "==", true)))
  ]);
  const official = {};
  officialSnap.forEach(d => { official[d.id] = gameFromDoc(d); });
  return {
    userGames: userSnap.docs.map(gameFromDoc).filter(visible),
    official
  };
}

async function myLikes() {
  const u = await ensureViewer();
  const snap = await getDocs(collection(db, "users", u.uid, "likes"));
  return new Set(snap.docs.map(d => d.id));
}

async function myGames() {
  if (!isMember()) return [];
  const snap = await getDocs(query(collection(db, "games"), where("ownerUid", "==", user.uid)));
  return snap.docs.map(gameFromDoc).sort((a, b) => b.createdAt - a.createdAt);
}

async function reportedGames() {
  const snap = await getDocs(query(collection(db, "games"), where("reportCount", ">", 0)));
  return snap.docs.map(gameFromDoc).sort((a, b) => b.reportCount - a.reportCount);
}

/* ---------- 좋아요·플레이·신고 ---------- */

const officialKnown = new Set();

/* 공식 게임은 카운터 문서가 없을 수 있어 처음 한 번 만들어 둡니다. */
async function ensureOfficial(id) {
  if (officialKnown.has(id) || id.startsWith("u_")) return;
  const ref = doc(db, "games", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    try {
      await setDoc(ref, { official: true, hidden: false, likeCount: 0, playCount: 0, reportCount: 0 });
    } catch (e) { /* 동시에 누가 만들었으면 괜찮습니다 */ }
  }
  officialKnown.add(id);
}

async function setLike(id, on) {
  const u = await ensureViewer();
  await ensureOfficial(id);
  const b = writeBatch(db);
  b.update(doc(db, "games", id), { likeCount: increment(on ? 1 : -1) });
  const likeRef = doc(db, "users", u.uid, "likes", id);
  if (on) b.set(likeRef, { at: serverTimestamp() }); else b.delete(likeRef);
  await b.commit();
}

/* 플레이 수 +1, 그리고 내 기록(내 페이지)에 "마지막으로 한 시각"을 남깁니다. */
async function addPlay(id) {
  const u = await ensureViewer();
  await ensureOfficial(id);
  const b = writeBatch(db);
  b.update(doc(db, "games", id), { playCount: increment(1) });
  b.set(doc(db, "users", u.uid, "history", id), { at: serverTimestamp() });
  await b.commit();
}

/* ---------- 내 페이지 ---------- */

/* 지금 로그인된 계정(익명 포함)이 없으면 null — 내 페이지를 열었다고 계정을 만들지 않습니다. */
async function currentViewer() {
  await firstAuth;
  return auth.currentUser;
}

async function listByTime(sub, max) {
  const u = await currentViewer();
  if (!u) return [];
  const snap = await getDocs(query(collection(db, "users", u.uid, sub), orderBy("at", "desc"), limit(max || 60)));
  return snap.docs.map(d => ({ id: d.id, at: d.data().at ? d.data().at.toMillis() : 0 }));
}
const myHistory   = max => listByTime("history", max);
const myLikedList = max => listByTime("likes", max);

/* 게임 id 여러 개 → 게임 정보. 지워진 게임은 빠집니다. */
async function getGames(ids) {
  const snaps = await Promise.all(ids.map(id => getDoc(doc(db, "games", id)).catch(() => null)));
  const out = {};
  snaps.forEach(s => { if (s && s.exists()) out[s.id] = gameFromDoc(s); });
  return out;
}

async function clearHistory() {
  const u = await currentViewer();
  if (!u) return;
  const snap = await getDocs(collection(db, "users", u.uid, "history"));
  for (let i = 0; i < snap.docs.length; i += 400) {
    const b = writeBatch(db);
    snap.docs.slice(i, i + 400).forEach(d => b.delete(d.ref));
    await b.commit();
  }
}

async function report(id, reason) {
  const u = await ensureViewer();
  const b = writeBatch(db);
  b.update(doc(db, "games", id), { reportCount: increment(1) });
  b.set(doc(db, "users", u.uid, "reports", id), { at: serverTimestamp(), reason: String(reason || "").slice(0, 200) });
  await b.commit();
}

/* ---------- 업로드 ---------- */

const UPLOAD = {
  files: 400,
  totalBytes: 40 * 1024 * 1024,
  fileBytes: 25 * 1024 * 1024,
  thumbBytes: 1024 * 1024
};
const ALLOWED_EXT = new Set(("html htm js mjs css json txt xml csv atlas fnt png jpg jpeg gif webp avif svg ico " +
  "mp3 ogg wav m4a aac mp4 webm woff woff2 ttf otf wasm bin data glb gltf").split(" "));
const SKIP = /(^|\/)(__MACOSX\/|\.DS_Store$|Thumbs\.db$|desktop\.ini$|\.git\/)/;

function playUrl(id) { return PLAY_ORIGIN + "/g/" + id + "/"; }

function extOf(p) { const m = /\.([a-z0-9]+)$/i.exec(p); return m ? m[1].toLowerCase() : ""; }

/* zip → [{ path, data }] , 맨 위 폴더 하나로 감싸져 있으면 벗겨 냅니다. */
async function readZip(file) {
  const { unzipSync } = await import("https://cdn.jsdelivr.net/npm/fflate@0.8.2/esm/browser.js");
  let entries;
  try {
    entries = unzipSync(new Uint8Array(await file.arrayBuffer()));
  } catch (e) {
    throw new Error("zip 파일을 열 수 없어요. 압축이 깨졌거나 zip이 아닌 것 같아요.");
  }
  let files = Object.keys(entries)
    .filter(p => !p.endsWith("/") && !SKIP.test(p))
    .map(p => ({ path: p.replace(/\\/g, "/"), data: entries[p] }));

  if (!files.some(f => f.path === "index.html")) {
    const tops = new Set(files.map(f => f.path.split("/")[0]));
    const top = tops.size === 1 ? [...tops][0] : null;
    if (top && files.some(f => f.path === top + "/index.html")) {
      files = files.map(f => ({ path: f.path.slice(top.length + 1), data: f.data }));
    }
  }
  return files;
}

function checkFiles(files) {
  if (!files.some(f => f.path === "index.html")) {
    throw new Error("zip 맨 위에 index.html이 있어야 해요.");
  }
  if (files.length > UPLOAD.files) throw new Error("파일이 너무 많아요. (최대 " + UPLOAD.files + "개)");
  let total = 0;
  for (const f of files) {
    if (!ALLOWED_EXT.has(extOf(f.path))) throw new Error("올릴 수 없는 파일 종류예요: " + f.path);
    if (f.data.length > UPLOAD.fileBytes) throw new Error("파일 하나가 너무 커요: " + f.path);
    if (/[?#%]/.test(f.path) || f.path.split("/").some(s => s === ".." || s === ".")) {
      throw new Error("파일 이름에 쓸 수 없는 글자가 있어요: " + f.path);
    }
    total += f.data.length;
  }
  if (total > UPLOAD.totalBytes) throw new Error("게임이 너무 커요. 압축을 푼 크기가 40MB 이하여야 해요.");
  return total;
}

async function api(method, path, body, headers) {
  const token = await auth.currentUser.getIdToken();
  const res = await fetch(PLAY_ORIGIN + path, {
    method,
    headers: Object.assign({ Authorization: "Bearer " + token }, headers || {}),
    body
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || ("서버 오류 " + res.status));
  return data;
}

/* meta: { title, desc, tags[] }, zipFile: File, thumbFile: File|null
   onProgress(0~1, 문구) */
async function uploadGame(zipFile, thumbFile, meta, onProgress) {
  if (!isMember()) throw new Error("구글로 로그인해야 올릴 수 있어요.");
  const say = onProgress || (() => {});

  say(0, "zip 푸는 중");
  const files = await readZip(zipFile);
  const total = checkFiles(files);

  let thumb = "";
  if (thumbFile) {
    const ext = extOf(thumbFile.name);
    if (!["png", "jpg", "jpeg", "webp"].includes(ext)) throw new Error("썸네일은 png, jpg, webp만 돼요.");
    if (thumbFile.size > UPLOAD.thumbBytes) throw new Error("썸네일은 1MB 이하여야 해요.");
    thumb = "__thumb." + ext;
    files.push({ path: thumb, data: new Uint8Array(await thumbFile.arrayBuffer()) });
  }

  say(0.02, "자리 만드는 중");
  const { id } = await api("POST", "/api/games",
    JSON.stringify({ files: files.map(f => ({ path: f.path, size: f.data.length })) }),
    { "Content-Type": "application/json" });

  // 4개씩 나눠 올립니다.
  let done = 0, sent = 0;
  const queue = files.slice();
  const totalAll = total + (thumbFile ? thumbFile.size : 0);
  async function worker() {
    while (queue.length) {
      const f = queue.shift();
      const encoded = f.path.split("/").map(encodeURIComponent).join("/");
      await api("PUT", "/api/games/" + id + "/files/" + encoded, f.data);
      done++; sent += f.data.length;
      say(0.05 + 0.9 * (sent / Math.max(1, totalAll)), "올리는 중 " + done + " / " + files.length);
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);

  say(0.97, "피드에 등록하는 중");
  await setDoc(doc(db, "games", id), {
    title: meta.title,
    desc: meta.desc,
    tags: meta.tags,
    ownerUid: user.uid,
    ownerName: (user.displayName || "").slice(0, 40),
    createdAt: serverTimestamp(),
    portrait: true,
    thumb,
    size: totalAll,
    files: files.length,
    hidden: false,
    likeCount: 0,
    playCount: 0,
    reportCount: 0
  });
  say(1, "완료");
  return id;
}

async function deleteGame(id) {
  await api("DELETE", "/api/games/" + id);
  await deleteDoc(doc(db, "games", id));
}

async function setHidden(id, hidden) {
  await updateDoc(doc(db, "games", id), hidden ? { hidden: true } : { hidden: false, reviewed: true });
}

/* ---------- 내보내기 ---------- */

window.MobsPlatform = {
  PLAY_ORIGIN, REPORT_HIDE,
  playUrl, isMember, isAdmin, onUser, ensureViewer, signInGoogle, signOut,
  authReady: () => firstAuth,             // 저장된 로그인 상태를 다 읽으면 끝나는 Promise
  get user() { return user; },
  loadFeed, myLikes, myGames, reportedGames,
  currentViewer, myHistory, myLikedList, getGames, clearHistory, visible,
  setLike, addPlay, report,
  uploadGame, deleteGame, setHidden
};
window.dispatchEvent(new Event("mobs-platform-ready"));
