# 모브스 게임 플랫폼 — 설정 메모

유저가 웹 게임을 올리면 릴스처럼 피드(`/feed/`)에 바로 뜨는 플랫폼입니다.
필요할 때 여기서 계정·주소·명령어를 찾아 쓰세요.

> 이 문서에는 비밀번호·카드 정보 같은 **비밀 값이 없습니다.**
> Firebase 웹 설정(apiKey 등)은 원래 브라우저에 공개되는 값이라 적어 두어도 괜찮습니다.

---

## 1. 한눈에 보기

| 무엇 | 어디 |
|---|---|
| 피드 | https://modamobs.github.io/feed/ |
| 게임 올리기 | https://modamobs.github.io/upload/ |
| 내 페이지 (기록·좋아요·내 게임) | https://modamobs.github.io/me/ |
| 공개 프로필 | `https://modamobs.github.io/u/?id=<uid>` · 공식 모브스는 `/u/?id=mobs` |
| 유저 게임 실행 서버 | https://mobs-play.matgo-cert.workers.dev |
| 유저 게임 주소 형식 | `https://mobs-play.matgo-cert.workers.dev/g/<게임id>/` |
| 관리자 계정 | yamoda24@gmail.com (구글 로그인) — 다른 계정으로 로그인하면 관리 메뉴가 안 보임 |

```
[브라우저]  modamobs.github.io (GitHub Pages)
   ├─ 피드·업로드 화면 ── Firebase Auth (익명 / 구글 로그인)
   │                    └ Firestore (게임 정보·좋아요·신고)
   └─ 게임 iframe ──────── Cloudflare Worker "mobs-play" ── R2 "mobs-play-games" (게임 파일)
```

---

## 2. 계정·프로젝트

### Firebase
- 콘솔: https://console.firebase.google.com/project/mobs-play-platform/overview
- 프로젝트 ID: `mobs-play-platform`
- 웹 앱 ID: `1:741887586115:web:74f1561b5fc3f6129709f6`
- Firestore 위치: `asia-northeast3` (서울)
- 로그인 계정(CLI): yamoda24@gmail.com
- 웹 설정값은 [`js/platform.js`](../js/platform.js) 맨 위 `firebaseConfig`에 있습니다.

### Cloudflare
- 대시보드: https://dash.cloudflare.com/f3c41dddd40b7659a6695aeba6864424
- 계정 ID: `f3c41dddd40b7659a6695aeba6864424`
- 로그인 계정: yamoda24@gmail.com
- workers.dev 하위 도메인: `matgo-cert`
- Worker 이름: `mobs-play`
- R2 버킷 이름: `mobs-play-games`

### GitHub
- 실제 사이트 저장소: https://github.com/modamobs/modamobs.github.io (`pages` 리모트, `main` 브랜치)

---

## 3. 요금 (무료 한도)

**Cloudflare R2** — 매달 이만큼은 무료, 넘으면 등록한 카드로 청구
| 항목 | 무료 | 넘으면 |
|---|---|---|
| 저장 공간 | 10 GB | $0.015 / GB·월 |
| 쓰기(Class A) | 100만 번 | $4.50 / 100만 번 |
| 읽기(Class B) | 1,000만 번 | $0.36 / 100만 번 |
| 다운로드 트래픽 | 항상 무료 | — |

**Cloudflare Workers 무료 플랜** — 하루 요청 10만 번, 요청당 CPU 10ms
(그래서 zip은 서버가 아니라 브라우저에서 풉니다)

**Firebase 무료(Spark) 플랜** — Firestore 하루 읽기 5만 / 쓰기 2만 / 삭제 2만

사용량 알림: Cloudflare 대시보드 → Billing → Notifications 에서 켤 수 있습니다.

---

## 4. 자주 쓰는 명령어

모두 `E:\MyWebsite` 기준입니다.

**게임 서버(Worker) 로컬 실행** — R2를 흉내 내서 돌아갑니다. http://localhost:8787
```bash
npm --prefix platform/worker run dev
```
> 로컬 사이트(localhost:8000)도 평소엔 **실제 서버**에 올립니다. 게임 정보가 실제 Firestore에 저장되기 때문입니다.
> Worker 코드를 고치며 시험할 때만 브라우저 콘솔에서 `localStorage.playOrigin = "http://localhost:8787"` (끝나면 `localStorage.removeItem("playOrigin")`).

**게임 서버 배포**
```bash
npm --prefix platform/worker run deploy
```

**Firestore 보안 규칙·인덱스 배포** (`platform/firestore.rules`를 고친 뒤)
```bash
cd platform && npx firebase-tools deploy --only firestore --project mobs-play-platform
```

**R2 버킷 목록 / 만들기**
```bash
npx wrangler r2 bucket list
```
```bash
npx wrangler r2 bucket create mobs-play-games
```

**로그인 확인**
```bash
npx wrangler whoami
```
```bash
npx firebase-tools login:list
```

**사이트 배포** — 로컬 `main`이 오래돼서, `pages/main`에서 새 작업 브랜치를 따서 바뀐 파일만 넣고 올립니다.
```bash
git fetch pages
git worktree add -b deploy-<이름> <임시폴더> pages/main
# 바뀐 파일만 임시폴더로 복사 → 커밋
git -C <임시폴더> push pages deploy-<이름>:main
```

---

## 5. 파일 구성

| 파일 | 하는 일 |
|---|---|
| [`feed/index.html`](../feed/index.html), [`css/feed.css`](../css/feed.css), [`js/feed.js`](../js/feed.js) | 릴스형 피드 |
| [`upload/index.html`](../upload/index.html) | 게임 올리기, 내 게임 관리, 신고된 게임 관리(관리자) |
| [`feed/terms.html`](../feed/terms.html), [`feed/privacy-policy.html`](../feed/privacy-policy.html) | 이용약관, 개인정보 처리방침 |
| [`upload/sample-game.zip`](../upload/sample-game.zip) | 업로드 페이지에서 받는 샘플 게임 (`platform/sample-game`을 묶은 것) |
| [`js/platform.js`](../js/platform.js) | Firebase 로그인·데이터, 업로드 (`window.MobsPlatform`) |
| [`js/account.js`](../js/account.js) | 메인·피드 오른쪽 위 로그인 버튼과 계정 메뉴 (`<div data-account>`) |
| [`platform/worker/src/index.js`](worker/src/index.js) | 업로드 API + 게임 실행 서버 |
| [`platform/worker/wrangler.jsonc`](worker/wrangler.jsonc) | Worker 이름·R2 연결·허용 주소·관리자 이메일 |
| [`platform/firestore.rules`](firestore.rules) | Firestore 보안 규칙 |
| [`platform/firestore.indexes.json`](firestore.indexes.json) | Firestore 인덱스 |
| [`platform/sample-game/`](sample-game/index.html) | 샘플 게임 "별 잡기" — 업로드 템플릿 (점수 보내기 포함) |

---

## 6. 데이터 구조 (Firestore)

- `games/{id}`
  - 유저 게임: id = `u_` + 영숫자 10자. 제목·설명·태그·올린 사람·`createdAt`·썸네일 파일명 + 카운터
  - 공식 게임: id = `js/games.js`의 slug. `{ official: true }` + 카운터만
  - 카운터: `likeCount`, `playCount`, `reportCount` / 상태: `hidden`, `reviewed`
- `subs/{creatorId}` — 구독자 수 `{ count }` (공개, creatorId = uid 또는 공식 "mobs")
- `users/{uid}` — `{ notifSeenAt }` 알림을 마지막으로 연 시각 (본인만)
- `users/{uid}/subscriptions/{creatorId}` — 내가 구독한 사람 `{ at }` (본인만, 구글 회원만 구독 가능)
- `profiles/{uid}` — 공개 프로필 `{ name, photo, updatedAt }` (게임 올릴 때·내 페이지 열 때 저장, 사진은 구글 프로필 사진 주소만)
- `users/{uid}/likes/{gameId}` — 내 좋아요 (한 사람 한 게임 1개)
- `users/{uid}/reports/{gameId}` — 내 신고 (한 사람 한 게임 1번)
- `users/{uid}/history/{gameId}` — 내 플레이 기록 `{ at }` (게임마다 마지막 플레이 시각, 본인만 읽기·지우기)

R2 파일: `g/{id}/__manifest.json`(올린 사람·파일 목록), `g/{id}/<파일들>`

---

## 7. 운영 규칙

- 알림: 구독한 제작자가 구독 **이후** 올린, 숨겨지지 않은 게임. 서버 작업 없이 볼 때마다 계산
  (games: ownerUid + createdAt 인덱스 사용). 폰 푸시 알림은 아직 없음 — 하려면 FCM + 예약 실행 서버가 필요

- 올리면 **바로 공개**. 신고가 **3건** 쌓이면 관리자가 확인할 때까지 피드에서 숨김.
- 관리자(yamoda24@gmail.com으로 구글 로그인)는 `/upload/` 아래 "신고된 게임"에서 숨기기·보이기·삭제.
- 업로드 제한: zip 안 맨 위 `index.html` 필수, 압축 푼 크기 40MB, 파일 400개, 파일 하나 25MB, 썸네일 1MB.
- 보안: 유저 게임은 다른 주소(workers.dev) + sandbox iframe에서 실행. 바깥 서버로 통신 금지(CSP).
  라이브러리는 jsDelivr·cdnjs·unpkg에서만 불러올 수 있음.
- 게임 → 피드 점수 보내기:
  ```js
  parent.postMessage({ type: "mobs:score", score: 1234 }, "*");
  parent.postMessage({ type: "mobs:end" }, "*");  // 한 판 끝
  ```

---

## 8. 진행 상황 (2026-10-25)

- [x] Firebase 프로젝트·Firestore(서울)·보안 규칙
- [x] Worker 코드, 업로드 페이지, 피드 연동 — 로컬에서 확인
- [x] Cloudflare R2 활성화 (무료 플랜, Mastercard 등록)
- [x] R2 버킷 `mobs-play-games` 만들기(위치: APAC) + Worker 배포 → https://mobs-play.matgo-cert.workers.dev
- [x] Firebase 로그인 켜기 — Google(공개 이름 "모브스 게임")·익명, 승인된 도메인 `modamobs.github.io`
      (익명 계정 "자동 정리"는 끔 — 켜면 오래된 방문자의 좋아요 기록이 끊김)
- [x] 실제 업로드 시험 — 구글 로그인 → zip 올리기 → 피드 신규 탭 → 실제 서버에서 실행 → 삭제까지 확인
- [x] 이용약관(/feed/terms.html)·개인정보 처리방침(/feed/privacy-policy.html) 작성
- [x] 사이트 배포 (커밋 bfbb67f) — 누구나 구글 로그인으로 올릴 수 있게 공개됨
- [ ] 게임물 등급분류(게임산업법) 문제 확인 — 약관으로 해결되지 않음

> Firebase 로그인은 콘솔에서 켜 주세요. API로 켜면 Identity Platform으로 업그레이드되는데 되돌릴 수 없습니다.
