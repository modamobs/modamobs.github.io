/* ===================================================
   모브스 게임 플랫폼 — 업로드·실행 Worker
   ---------------------------------------------------
   유저가 올린 게임 파일을 R2에 두고, 이 Worker 주소에서 실행합니다.
   본 사이트(modamobs.github.io)와 주소가 달라서, 올라온 게임이
   본 사이트의 로그인 정보나 저장 데이터에 손댈 수 없습니다.

   무료 플랜은 요청당 CPU 10ms라 zip은 브라우저가 풉니다.
   Worker는 권한만 확인하고 파일을 그대로 R2로 흘려보냅니다.

   API (Authorization: Bearer <Firebase ID 토큰>, 구글 로그인 회원만)
     POST   /api/games                     { files: [{ path, size }] } → { id }
     PUT    /api/games/:id/files/<path>    본문 = 파일 그대로
     DELETE /api/games/:id                 올린 사람 또는 관리자

   실행
     GET    /g/:id/<path>                  R2에서 읽어 돌려줍니다 (빈 경로 = index.html)

   R2 키
     g/:id/__manifest.json                 { owner, files: { path: size }, createdAt }
     g/:id/<path>
   =================================================== */

const LIMITS = {
  files: 400,
  totalBytes: 40 * 1024 * 1024,
  fileBytes: 25 * 1024 * 1024,
  thumbBytes: 1024 * 1024,
  pathLength: 200
};

const TYPES = {
  html: "text/html; charset=utf-8", htm: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8", mjs: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8", json: "application/json; charset=utf-8",
  txt: "text/plain; charset=utf-8", xml: "application/xml; charset=utf-8",
  csv: "text/csv; charset=utf-8", atlas: "text/plain; charset=utf-8", fnt: "text/plain; charset=utf-8",
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif",
  webp: "image/webp", avif: "image/avif", svg: "image/svg+xml", ico: "image/x-icon",
  mp3: "audio/mpeg", ogg: "audio/ogg", wav: "audio/wav", m4a: "audio/mp4", aac: "audio/aac",
  mp4: "video/mp4", webm: "video/webm",
  woff: "font/woff", woff2: "font/woff2", ttf: "font/ttf", otf: "font/otf",
  wasm: "application/wasm",
  bin: "application/octet-stream", data: "application/octet-stream",
  glb: "model/gltf-binary", gltf: "model/gltf+json"
};

const THUMB = /^__thumb\.(png|jpg|jpeg|webp)$/;
const ID = /^u_[a-z0-9]{10}$/;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/")) return await api(request, env, url);
      if (url.pathname.startsWith("/g/"))   return await serve(request, env, url);
      if (url.pathname === "/") return text("모브스 게임 플레이 서버", 200);
      return text("Not found", 404);
    } catch (e) {
      if (e instanceof HttpError) return cors(request, env, json({ error: e.message }, e.status));
      console.error(e);
      return cors(request, env, json({ error: "server error" }, 500));
    }
  }
};

/* ---------- 실행 ---------- */

async function serve(request, env, url) {
  if (request.method !== "GET" && request.method !== "HEAD") return text("Method not allowed", 405);

  const rest = url.pathname.slice(3);                // ":id/<path>"
  const slash = rest.indexOf("/");
  if (slash < 0) return Response.redirect(url.origin + url.pathname + "/", 301);
  const id = rest.slice(0, slash);
  let path = safeDecode(rest.slice(slash + 1));
  if (!ID.test(id) || path == null || path.split("/").includes("..")) return text("Not found", 404);
  if (path === "" || path.endsWith("/")) path += "index.html";
  if (path === "__manifest.json") return text("Not found", 404);

  const obj = await env.BUCKET.get("g/" + id + "/" + path);
  if (!obj) return text("Not found", 404);

  const headers = new Headers();
  headers.set("Content-Type", TYPES[ext(path)] || "application/octet-stream");
  headers.set("Cache-Control", "public, max-age=86400");
  headers.set("ETag", obj.httpEtag);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("Cross-Origin-Resource-Policy", "cross-origin");
  headers.set("Content-Security-Policy", gameCsp(env));
  return new Response(request.method === "HEAD" ? null : obj.body, { headers });
}

const CDNS = "https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com";

/* 게임은 자기 파일만 읽을 수 있고, 바깥 서버로는 아무것도 보내지 못합니다. */
function gameCsp(env) {
  const ancestors = origins(env).join(" ");
  return [
    "default-src 'self' data: blob:",
    // 라이브러리 CDN은 불러올 수 있게 둡니다(어차피 스크립트는 자유). 막는 건 "밖으로 보내기"입니다.
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob: " + CDNS,
    "style-src 'self' 'unsafe-inline' " + CDNS + " https://fonts.googleapis.com",
    "img-src 'self' data: blob:",
    "media-src 'self' data: blob:",
    "font-src 'self' data: " + CDNS + " https://fonts.gstatic.com",
    "connect-src 'self' data: blob:",
    "worker-src 'self' blob:",
    "frame-src 'none'",
    "object-src 'none'",
    "form-action 'none'",
    "base-uri 'self'",
    "frame-ancestors " + ancestors
  ].join("; ");
}

/* ---------- API ---------- */

async function api(request, env, url) {
  if (request.method === "OPTIONS") return cors(request, env, new Response(null, { status: 204 }));

  const user = await verifyUser(request, env);
  const parts = url.pathname.split("/");             // ["", "api", "games", id, "files", ...path]
  if (parts[2] !== "games") throw new HttpError(404, "not found");
  const id = parts[3];

  // 새 게임 자리 만들기
  if (request.method === "POST" && !id) {
    const body = await request.json().catch(() => null);
    const files = checkFileList(body && body.files);
    const newId = "u_" + randomId(10);
    const manifest = { owner: user.uid, files, createdAt: Date.now() };
    await env.BUCKET.put("g/" + newId + "/__manifest.json", JSON.stringify(manifest), {
      httpMetadata: { contentType: "application/json" }
    });
    return cors(request, env, json({ id: newId }, 201));
  }

  if (!id || !ID.test(id)) throw new HttpError(404, "not found");
  const manifest = await readManifest(env, id);

  // 파일 하나 올리기
  if (request.method === "PUT" && parts[4] === "files") {
    if (manifest.owner !== user.uid) throw new HttpError(403, "not yours");
    const path = safeDecode(parts.slice(5).join("/"));
    if (path == null || !(path in manifest.files)) throw new HttpError(400, "file not in list");
    const declared = manifest.files[path];
    const length = Number(request.headers.get("Content-Length"));
    if (!Number.isFinite(length) || length !== declared) throw new HttpError(400, "size mismatch");

    await env.BUCKET.put("g/" + id + "/" + path, request.body, {
      httpMetadata: { contentType: TYPES[ext(path)] || "application/octet-stream" }
    });
    return cors(request, env, json({ ok: true }));
  }

  // 게임 지우기
  if (request.method === "DELETE" && parts.length === 4) {
    if (manifest.owner !== user.uid && !isAdmin(user, env)) throw new HttpError(403, "not yours");
    const prefix = "g/" + id + "/";
    let cursor;
    do {
      const list = await env.BUCKET.list({ prefix, cursor });
      if (list.objects.length) await env.BUCKET.delete(list.objects.map(o => o.key));
      cursor = list.truncated ? list.cursor : undefined;
    } while (cursor);
    return cors(request, env, json({ ok: true }));
  }

  throw new HttpError(405, "method not allowed");
}

function checkFileList(files) {
  if (!Array.isArray(files) || files.length === 0) throw new HttpError(400, "no files");
  if (files.length > LIMITS.files) throw new HttpError(400, "too many files");

  const out = {};
  let total = 0;
  for (const f of files) {
    const path = f && f.path;
    const size = f && f.size;
    if (typeof path !== "string" || !validPath(path)) throw new HttpError(400, "bad path: " + String(path).slice(0, 80));
    if (!Number.isInteger(size) || size < 0 || size > LIMITS.fileBytes) throw new HttpError(400, "bad size: " + path);
    if (THUMB.test(path)) {
      if (size > LIMITS.thumbBytes) throw new HttpError(400, "thumbnail too big");
    } else if (!TYPES[ext(path)]) {
      throw new HttpError(400, "file type not allowed: " + path);
    }
    if (path in out) throw new HttpError(400, "duplicate: " + path);
    out[path] = size;
    total += size;
  }
  if (total > LIMITS.totalBytes) throw new HttpError(400, "too big");
  if (!("index.html" in out)) throw new HttpError(400, "index.html missing");
  return out;
}

function validPath(p) {
  if (!p || p.length > LIMITS.pathLength) return false;
  if (p.startsWith("/") || p.endsWith("/") || p.includes("\\")) return false;
  if (/[\u0000-\u001f\u007f?#%]/.test(p)) return false;
  if (p === "__manifest.json") return false;
  return p.split("/").every(seg => seg && seg !== "." && seg !== "..");
}

async function readManifest(env, id) {
  const obj = await env.BUCKET.get("g/" + id + "/__manifest.json");
  if (!obj) throw new HttpError(404, "no such game");
  return obj.json();
}

/* ---------- Firebase ID 토큰 확인 ---------- */
// https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library

const JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
let jwksCache = { keys: null, until: 0 };

async function verifyUser(request, env) {
  const m = /^Bearer (.+)$/.exec(request.headers.get("Authorization") || "");
  if (!m) throw new HttpError(401, "login required");

  const [h, p, s] = m[1].split(".");
  if (!s) throw new HttpError(401, "bad token");
  let header, claims;
  try {
    header = JSON.parse(b64text(h));
    claims = JSON.parse(b64text(p));
  } catch (e) {
    throw new HttpError(401, "bad token");
  }
  const now = Math.floor(Date.now() / 1000);
  const project = env.FIREBASE_PROJECT_ID;

  if (header.alg !== "RS256") throw new HttpError(401, "bad token");
  if (claims.aud !== project || claims.iss !== "https://securetoken.google.com/" + project) throw new HttpError(401, "bad token");
  if (!(claims.exp > now) || !(claims.iat <= now + 60) || !claims.sub) throw new HttpError(401, "token expired");

  const jwk = (await jwks()).find(k => k.kid === header.kid);
  if (!jwk) throw new HttpError(401, "bad token");
  const key = await crypto.subtle.importKey(
    "jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5", key, b64bytes(s), new TextEncoder().encode(h + "." + p));
  if (!ok) throw new HttpError(401, "bad token");

  const provider = claims.firebase && claims.firebase.sign_in_provider;
  if (!provider || provider === "anonymous") throw new HttpError(403, "google login required");
  return { uid: claims.sub, email: claims.email, emailVerified: claims.email_verified === true };
}

async function jwks() {
  if (jwksCache.keys && Date.now() < jwksCache.until) return jwksCache.keys;
  const res = await fetch(JWKS_URL);
  const data = await res.json();
  const maxAge = Number((/max-age=(\d+)/.exec(res.headers.get("Cache-Control") || "") || [])[1]) || 3600;
  jwksCache = { keys: data.keys, until: Date.now() + maxAge * 1000 };
  return data.keys;
}

function isAdmin(user, env) {
  return user.emailVerified && (env.ADMIN_EMAILS || "").split(",").map(s => s.trim()).includes(user.email);
}

/* ---------- 도우미 ---------- */

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function origins(env) {
  return (env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
}

function cors(request, env, res) {
  const origin = request.headers.get("Origin");
  const headers = new Headers(res.headers);
  if (origin && origins(env).includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
    headers.set("Access-Control-Max-Age", "86400");
    headers.set("Vary", "Origin");
  }
  return new Response(res.body, { status: res.status, headers });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}
function text(body, status) {
  return new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

function ext(path) {
  const m = /\.([a-z0-9]+)$/i.exec(path);
  return m ? m[1].toLowerCase() : "";
}

function safeDecode(s) {
  try { return decodeURIComponent(s); } catch (e) { return null; }
}

function randomId(n) {
  const abc = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(n));
  return Array.from(bytes, b => abc[b % 36]).join("");
}

function b64bytes(s) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}
function b64text(s) {
  return new TextDecoder().decode(b64bytes(s));
}
