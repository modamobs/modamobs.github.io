/* ===================================================
   게임 포털 데이터
   ---------------------------------------------------
   포털(/)에 뜨는 게임 목록입니다. 여기만 고치면 됩니다.

   각 항목의 필드:
     slug     : 사이트 안에서 쓰는 폴더 이름              (필수, 예: "sudoku")
     title    : 게임 이름                                 (필수)
     desc     : 카드에 들어가는 한 줄 설명                (필수)
     genres   : 장르 배열 — 필터 버튼이 자동 생성됩니다   (필수)
     status   : "web"  = 브라우저에서 바로 플레이
                "app"  = 앱으로만 플레이 (스토어 링크)
                "soon" = 준비 중
     playable : status가 "web"일 때만 의미 있습니다.
                ⚠️ 게임 빌드를 /<slug>/play/ 에 복사하기 전에는 false로 두세요.
                   true로 두면 플레이 버튼이 404로 갑니다.
                   빌드 복사는 tools/sync-games.bat 참고.
     play     : 플레이 주소. 같은 사이트면 "/<slug>/play/",
                다른 곳에 올렸으면 "https://..." 전체 주소도 됩니다.
     about    : 소개 페이지 주소 (선택)
     store    : Google Play 주소 (선택)
     thumb    : 썸네일 (선택, 없으면 이니셜 썸네일이 나옵니다)
     accent   : 카드 포인트 색 (선택, 게임 테마색)
     portrait : true면 세로 화면 게임 — 플레이어가 세로 비율로 띄웁니다
   =================================================== */

const GAMES = [
  {
    slug: "sudoku",
    title: "클래식 스도쿠",
    desc: "여섯 난이도와 날마다 새로 열리는 데일리 판. 찍지 않고 논리만으로 끝까지 풀립니다.",
    genres: ["퍼즐", "논리"],
    status: "web",
    playable: true,
    play: "/sudoku/play/",
    about: "/sudoku/",
    store: "https://play.google.com/store/apps/details?id=com.mobs.sudoku",
    thumb: "/assets/images/sudoku.png",
    accent: "#7dd3fc",
    portrait: true
  },
  {
    slug: "arrow-box",
    title: "Arrow Box",
    desc: "상자에 붙은 화살표를 눌러 모두 빼내는 3D 퍼즐. 막다른 길이 없으니 순서만 찾으면 됩니다.",
    genres: ["퍼즐", "3D"],
    status: "web",
    playable: true,
    play: "/arrow-box/play/",
    about: "/arrow-box/",
    thumb: "/assets/images/arrow-box.png",
    accent: "#fbbf24",
    portrait: true
  },
  {
    slug: "mergecity",
    title: "문명 2048",
    desc: "같은 건물 둘을 붙이면 한 단계 위 건물로. 판이 끝나도 점수가 재건 자재로 남습니다.",
    genres: ["퍼즐", "머지"],
    status: "web",
    playable: false,
    play: "/mergecity/play/",
    about: "/mergecity/",
    thumb: "/assets/images/mergecity.png",
    accent: "#6fd0ef",
    portrait: true
  },
  {
    slug: "tilefeast",
    title: "Tile Feast",
    desc: "같은 재료 타일 셋을 찾아 맞추는 타일 퍼즐. 트레이가 일곱 칸뿐이라 순서가 실력이 됩니다.",
    genres: ["퍼즐", "캐주얼"],
    status: "web",
    playable: true,
    play: "/tilefeast/play/",
    about: "/tilefeast/",
    thumb: "/assets/images/tilefeast.png",
    accent: "#2a9df4",
    portrait: true
  },
  {
    slug: "hiddenfind",
    title: "숨은그림 찾기",
    desc: "따뜻한 손그림 속에서 물건을 찾습니다. 시간이 다 되어도 실패하지 않습니다.",
    genres: ["캐주얼", "관찰"],
    status: "web",
    playable: false,
    play: "/hiddenfind/play/",
    about: "/hiddenfind/",
    thumb: "/assets/images/hiddenfind.png",
    accent: "#bfe7ff",
    portrait: true
  },

  /* ── 앱으로만 플레이 ───────────────────────────── */
  {
    slug: "crosssum",
    title: "CrossSum",
    desc: "누르면 사방에서 같은 숫자가 몰려와 두 배가 되는 4×4 머지 퍼즐. 실시간 1:1 대전과 일일 챌린지.",
    genres: ["퍼즐", "머지", "대전"],
    status: "app",
    about: "/crosssum/",
    store: "https://play.google.com/store/apps/details?id=com.mobs.crosssum",
    thumb: "/assets/images/crosssum.png",
    accent: "#a78bfa"
  },

  /* ── 준비 중 ──────────────────────────────────── */
  {
    slug: "dailyfarm",
    title: "오늘의 농장",
    desc: "색깔 영역마다 동물을 한 마리씩. 찍기 없이 논리만으로 푸는 200판.",
    genres: ["퍼즐", "논리"],
    status: "web",
    playable: true,
    play: "/dailyfarm/play/",
    about: "/dailyfarm/",
    thumb: "/assets/images/dailyfarm.png",
    accent: "#86efac",
    portrait: true
  },
  {
    slug: "reeldungeon",
    title: "릴 던전",
    desc: "5×4 릴을 굴려 페이라인이 서면 보스를 때리는 슬롯머신 로그라이크.",
    genres: ["로그라이크"],
    status: "web",
    playable: true,
    play: "/reeldungeon/play/",
    about: "/reeldungeon/",
    thumb: "/assets/images/reeldungeon.png",
    accent: "#f472b6",
    portrait: true
  },
  {
    slug: "swordgirl",
    title: "여검사 키우기",
    desc: "자리를 비운 사이에도 강해지는 여검사를 키우는 방치형 성장 RPG.",
    genres: ["방치형", "RPG"],
    status: "soon",
    about: "/swordgirl/",
    thumb: "",
    accent: "#fb7185"
  },
  {
    slug: "upgradekim",
    title: "강화용자 김회춘",
    desc: "한 번 더 누르면 될 것 같은 그 마음. 터지고 또 도전하는 강화 게임.",
    genres: ["캐주얼", "강화"],
    status: "soon",
    about: "/upgradekim/",
    thumb: "",
    accent: "#fca5a5"
  }
];
