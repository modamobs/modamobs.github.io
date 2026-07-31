# MyWebsite

개인 포트폴리오 홈페이지. 순수 HTML / CSS / JavaScript로 만들어 빌드 과정이 없습니다.

## 구조

```
index.html            페이지 전체 (Hero / 소개 / 프로젝트 / 연락)
css/style.css         스타일 및 디자인 토큰 (다크 모드 포함)
js/projects.js        프로젝트 데이터 ← 주로 여기를 수정합니다
js/main.js            렌더링, 필터, 테마 전환, 스크롤 모션
assets/images/        프로젝트 스크린샷
```

## 모션

- **스크롤 등장**: `data-reveal` 속성이 붙은 요소를 `IntersectionObserver`가
  감지해 순차적으로 나타냅니다. 지연 시간은 `--reveal-delay` 인라인 변수로 조절합니다.
- **관성 스크롤**: [Lenis](https://github.com/darkroomengineering/lenis)를 CDN으로 불러옵니다.
  로드에 실패해도 브라우저 기본 스크롤로 정상 동작합니다.
- **히어로 패럴랙스**: 배경 그라디언트가 스크롤의 0.28배로 천천히 따라옵니다.

OS에서 "동작 줄이기"를 켠 사용자에게는 모든 모션이 자동으로 꺼집니다.

⚠️ Lenis 사용 시 `html`에 `scroll-behavior: smooth`가 남아 있으면 스크롤이 멈춥니다.
`style.css`의 `html.lenis { scroll-behavior: auto !important; }` 규칙을 지우지 마세요.

## 로컬에서 보기

`index.html`을 브라우저로 직접 열어도 동작합니다. 로컬 서버로 띄우려면:

```bash
python -m http.server 8000
```

이후 http://localhost:8000 접속.

## 내용 수정하기

| 무엇을 | 어디를 |
|---|---|
| 프로젝트 추가 / 수정 | `js/projects.js`의 `PROJECTS` 배열 |
| 자기소개 문구 | `index.html`의 `#about` 섹션 |
| 기술 스택 태그 | `index.html`의 `.about-skills` |
| 연락처 | `index.html`의 `#contact` 섹션 |
| 색상 / 폰트 | `css/style.css` 최상단의 `:root` 변수 |

프로젝트 분류(`category`) 필터 버튼은 데이터에 있는 값으로 자동 생성됩니다.
새 분류를 쓰면 버튼도 자동으로 늘어납니다.

## 배포

아직 배포 전입니다. 저장소가 private이므로 GitHub Pages를 쓰려면 public 전환이
필요하고, private을 유지하려면 Cloudflare Pages 또는 Vercel을 사용합니다.
