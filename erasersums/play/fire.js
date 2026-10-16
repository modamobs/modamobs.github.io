/* 지우개 셈 — Firestore (대결 기록 모으기). SDK 없이 REST 만 쓴다(스도쿠 src/league/firestore.ts 와 같은 방식).
 *
 * 로그인은 Firebase 익명 로그인 — 같은 기기 = 같은 uid. 토큰은 localStorage 에 두고 만료 전에 새로 받는다.
 * 규칙은 저장소의 firestore.rules (읽기는 누구나, 쓰기는 자기 uid 로 새 문서만).
 *
 * CONFIG 가 비어 있으면 ready 가 false 이고 대결이 열리지 않는다. 새 Firebase 프로젝트를 만들면 채운다
 * (README 「대결 서버」). apiKey 는 공개 웹 키다 — 앱 안에 그대로 실려 나가도 되는 값.
 *
 * 무엇이 실패해도 던지지 않고 null 을 돌려준다. 대결은 못 해도 게임은 돈다.
 */
(function () {
  'use strict';
  // Firebase 프로젝트 eraser-sums-mobs(안드로이드 애널리틱스와 같은 프로젝트) · 웹 앱 「Eraser Sums Toss」 (2026-10-07)
  const CONFIG = { project: 'eraser-sums-mobs', apiKey: 'AIzaSyDYC3eParVN5nsP1C48Qj9jfU0Rhlmazw0' };
  const ready = !!(CONFIG.project && CONFIG.apiKey);
  const KEY = 'jiugae-fb-auth';
  const DB = `projects/${CONFIG.project}/databases/(default)/documents`;
  const BASE = `https://firestore.googleapis.com/v1/${DB}`;

  async function json(url, opt, ms) {
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), ms || 8000) : 0;
    try {
      const r = await fetch(url, Object.assign({}, opt, ctl ? { signal: ctl.signal } : {}));
      if (!r.ok) return null;
      return await r.json();
    } catch (e) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  let auth = null;
  try { auth = JSON.parse(localStorage.getItem(KEY)); } catch (e) { auth = null; }
  const keepAuth = () => { try { localStorage.setItem(KEY, JSON.stringify(auth)); } catch (e) { /* 다음에 새로 */ } };

  /** 익명 로그인 토큰. { uid, id } 또는 null */
  async function signIn() {
    if (!ready) return null;
    if (auth && auth.id && auth.exp > Date.now() + 60000) return auth;
    if (auth && auth.refresh) {
      const r = await json(`https://securetoken.googleapis.com/v1/token?key=${CONFIG.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(auth.refresh)}`,
      });
      if (r && r.id_token) {
        auth = { uid: r.user_id, id: r.id_token, refresh: r.refresh_token, exp: Date.now() + (+r.expires_in || 3600) * 1000 };
        keepAuth();
        return auth;
      }
    }
    const r = await json(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${CONFIG.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnSecureToken: true }),
    });
    if (!r || !r.idToken) return null;
    auth = { uid: r.localId, id: r.idToken, refresh: r.refreshToken, exp: Date.now() + (+r.expiresIn || 3600) * 1000 };
    keepAuth();
    return auth;
  }

  // Firestore 값 꼴. 소수는 { double: x } 로 넘긴다(정수처럼 보이는 소수가 정수로 가지 않게)
  function enc(v) {
    if (v && typeof v === 'object' && 'double' in v) return { doubleValue: v.double };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(enc) } };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (typeof v === 'number') return { integerValue: String(Math.round(v)) };
    return { stringValue: String(v) };
  }
  function dec(v) {
    if (!v) return null;
    if ('integerValue' in v) return +v.integerValue;
    if ('doubleValue' in v) return +v.doubleValue;
    if ('booleanValue' in v) return v.booleanValue;
    if ('stringValue' in v) return v.stringValue;
    if ('arrayValue' in v) return (v.arrayValue.values || []).map(dec);
    if ('timestampValue' in v) return Date.parse(v.timestampValue);
    return null;
  }
  const fields = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, enc(v)]));

  /** 새 문서 하나. at 은 서버 시각으로 채운다. 됐으면 true */
  async function create(path, id, data) {
    const a = await signIn();
    if (!a) return false;
    const r = await json(`${BASE}:commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${a.id}` },
      body: JSON.stringify({
        writes: [{
          update: { name: `${DB}/${path}/${id}`, fields: fields(data) },
          currentDocument: { exists: false },
          updateTransforms: [{ fieldPath: 'at', setToServerValue: 'REQUEST_TIME' }],
        }],
      }),
    });
    return !!r;
  }

  /** parent 아래 col 에서 r >= from 인 것을 r 순서로 limit 개. 색인이 따로 필요 없는 꼴 */
  async function sample(parent, col, from, limit) {
    if (!ready) return null;
    const r = await json(`${BASE}/${parent}:runQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: col }],
          where: { fieldFilter: { field: { fieldPath: 'r' }, op: 'GREATER_THAN_OR_EQUAL', value: { doubleValue: from } } },
          orderBy: [{ field: { fieldPath: 'r' }, direction: 'ASCENDING' }],
          limit,
        },
      }),
    });
    if (!Array.isArray(r)) return null;
    return r.filter((x) => x.document).map((x) => {
      const o = {};
      for (const [k, v] of Object.entries(x.document.fields || {})) o[k] = dec(v);
      o.id = x.document.name.split('/').pop();
      return o;
    });
  }

  window.Fire = { ready, signIn, uid: () => (auth && auth.uid) || null, create, sample };
})();
