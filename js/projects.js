/* ===================================================
   프로젝트 데이터
   ---------------------------------------------------
   여기만 수정하면 사이트에 바로 반영됩니다.

   각 항목의 필드:
     title      : 프로젝트 이름                        (필수)
     category   : "게임" | "웹" 등                     (필수, 필터 버튼이 자동 생성됨)
     desc       : 한두 문장 설명                        (필수)
     tags       : 사용 기술 배열                        (선택)
     thumb      : 썸네일 이미지 경로                    (선택, 없으면 이니셜 썸네일 표시)
                  예) "assets/images/crosssum.png"
     links      : [{ label: "버튼 이름", url: "주소" }]  (선택)
                  첫 번째 링크가 카드 전체 클릭 대상이 됩니다.
     featured   : true면 "대표 프로젝트"로 큰 카드에 표시 (선택, 2~3개 권장)
     highlights : 대표 카드에만 표시되는 핵심 성과 목록   (선택, featured일 때)
   =================================================== */

const PROJECTS = [
  {
    title: "CrossSum",
    category: "게임",
    featured: true,
    // 스테이지 수는 적지 않습니다. 늘어날 때마다 스토어 등록정보·소개 페이지·여기를
    // 같이 고쳐야 하고, 한 곳을 빼먹으면 틀린 채로 남습니다.
    desc: "한 번 누르면 상하좌우에서 같은 숫자가 몰려오고, 붙은 방향마다 두 배가 되는 " +
          "4×4 머지 퍼즐. 저마다 목표가 다른 싱글 스테이지에 실시간 1:1 대전과 " +
          "매일 갱신되는 챌린지 랭킹을 더했습니다.",
    highlights: [
      "목표가 저마다 다른 싱글 스테이지 · 실시간 1:1 대전 · 일일 챌린지 랭킹",
      "언두·해머·요술봉 아이템과 타일 커스터마이징",
      "Google Play 출시 — 게스트로 바로 시작하고 구글 계정에 기록 연결"
    ],
    tags: ["Unity", "C#", "퍼즐", "실시간 대전"],
    thumb: "assets/images/crosssum.png",
    links: [
      // 첫 번째 링크가 카드 전체 클릭 대상입니다.
      // 같은 사이트 안의 페이지는 상대 경로로 두면 같은 탭에서 열립니다.
      { label: "소개 페이지", url: "crosssum/" },
      { label: "Google Play", url: "https://play.google.com/store/apps/details?id=com.mobs.crosssum" }
    ]
  },
  {
    title: "릴레이툰 (RelayToon)",
    category: "웹",
    featured: true,
    desc: "작가들이 다음 화 후보를 올리면 일주일 투표로 1위가 정식 연재되는 " +
          "릴레이 창작 플랫폼. 누구나 1화를 올려 릴레이를 시작할 수 있고, " +
          "웹툰·소설·영상 형식을 지원합니다.",
    highlights: [
      "투표로 다음 화가 결정되는 릴레이 연재 구조를 기획·구현",
      "웹툰·소설·영상 세 가지 형식 지원",
      "Vercel에 배포해 실서비스 운영 중"
    ],
    tags: ["Next.js", "React", "Vercel"],
    thumb: "",
    links: [
      { label: "서비스 바로가기", url: "https://relaytoon-mu.vercel.app/" }
    ]
  },
  {
    title: "클래식 스도쿠",
    category: "게임",
    featured: true,
    desc: "가로줄·세로줄·3×3 상자마다 1부터 9까지 한 번씩 놓는 스도쿠. 여섯 난이도와 " +
          "날마다 새로 열리는 데일리 판을 담았고, 모든 판은 답이 하나뿐이라 찍지 않고 " +
          "논리만으로 끝까지 풀립니다.",
    highlights: [
      "브라우저에서 설치도 로그인도 없이 바로 플레이",
      "여섯 난이도 · 데일리 판과 월간 트로피 · 같은 판을 겨루는 도전 코드",
      "Google Play 출시, 토스 미니앱으로도 서비스 중"
    ],
    tags: ["React", "TypeScript", "Vite", "Capacitor", "토스 미니앱"],
    thumb: "assets/images/sudoku.png",
    links: [
      // 첫 번째 링크가 카드 전체 클릭 대상입니다.
      { label: "소개 페이지", url: "sudoku/" },
      { label: "바로 플레이", url: "sudoku/play/" },
      { label: "Google Play", url: "https://play.google.com/store/apps/details?id=com.mobs.sudoku" }
    ]
  },
  {
    title: "Arrow Box",
    category: "게임",
    desc: "상자에 붙은 화살표를 눌러 모두 빼내는 3D 퍼즐. 머리가 가리키는 쪽으로 " +
          "미끄러져 나가고, 앞을 다른 화살표가 막고 있으면 튕깁니다. 판을 거꿘로 " +
          "만들어 막다른 길이 없으니, 순서만 찾으면 됩니다.",
    tags: ["React", "TypeScript", "three.js", "Capacitor"],
    thumb: "assets/images/arrow-box.png",
    links: [
      { label: "소개 페이지", url: "arrow-box/" }
    ]
  },
  {
    title: "릴 던전",
    category: "게임",
    desc: "5×4 릴을 굴려 페이라인이 서면 배당표만큼 보스를 때리는 슬롯머신 " +
          "로그라이크. 스핀 다섯 번 안에 라운드 목표를 넘기면 클리어하고, " +
          "다섯 칸뿐인 유물을 무엇으로 채울지가 판을 가릅니다.",
    tags: ["Flutter", "Dart", "로그라이크"],
    thumb: "",
    links: [
      { label: "소개 페이지", url: "reeldungeon/" }
    ]
  },
  {
    title: "Tile Feast",
    category: "게임",
    desc: "쌓인 재료 타일에서 같은 것 세 개를 찾아 맞추는 타일 퍼즐. 판을 다 비우면 " +
          "요리 한 접시가 완성되고, 배운 요리로 손님 주문을 받습니다. 트레이가 " +
          "일곱 칸뿐이라 무엇을 먼저 집을지가 실력이 됩니다.",
    tags: ["React", "TypeScript", "Vite", "Capacitor"],
    thumb: "assets/images/tilefeast.png",
    links: [
      { label: "소개 페이지", url: "tilefeast/" }
    ]
  },
  {
    title: "숨은그림 찾기",
    category: "게임",
    desc: "따뜻한 손그림 속에서 물건을 찾는 숨은그림찾기. 물건이 크고 또렷해서 확대하지 않아도 " +
          "보이고, 시간이 다 되어도 실패하지 않습니다. 방 스무 곳을 돌며, 같은 장면에 다시 와도 " +
          "그때는 다른 물건을 찾습니다.",
    tags: ["React", "TypeScript", "Vite", "Capacitor"],
    thumb: "assets/images/hiddenfind.png",
    links: [
      { label: "소개 페이지", url: "hiddenfind/" }
    ]
  },
  {
    title: "문명 2048",
    category: "게임",
    desc: "같은 건물 둘을 붙이면 한 단계 위 건물이 되는 2048 퍼즐. 보통의 2048과 " +
          "달리 판이 끝나도 점수가 재건 자재로 남아, 내 도시의 빈 부지를 하나씩 " +
          "복원해 나갑니다. 2에서 4096까지 열두 단계의 건물이 있습니다.",
    tags: ["React", "TypeScript", "Vite", "Capacitor"],
    thumb: "assets/images/mergecity.png",
    links: [
      { label: "소개 페이지", url: "mergecity/" }
    ]
  },
  {
    title: "오늘의 농장",
    category: "게임",
    desc: "색깔 영역마다 동물을 한 마리씩 놓는 논리 퍼즐. 가로줄·세로줄·색깔 " +
          "영역마다 정확히 한 마리, 대각선으로도 붙을 수 없습니다. 찍기 없이 " +
          "논리만으로 푸는 200판을 담았고, 정답 유일성은 전부 검증했습니다.",
    tags: ["Flutter", "Dart", "Python", "논리 퍼즐"],
    thumb: "assets/images/dailyfarm.png",
    links: [
      // 같은 사이트 안의 페이지는 상대 경로로 두면 같은 탭에서 열립니다.
      { label: "소개 페이지", url: "dailyfarm/" }
    ]
  },
  {
    title: "여검사 키우기",
    category: "게임",
    // ⚠️ 아래 설명·태그를 실제 게임 내용으로 바꿔 주세요.
    desc: "검 한 자루로 시작해, 자리를 비운 사이에도 강해지는 여검사를 키우는 " +
          "방치형 성장 RPG. 출시 준비 중입니다.",
    tags: ["Unity", "C#", "방치형 RPG"],
    thumb: "",
    links: [
      { label: "소개 페이지", url: "swordgirl/" }
    ]
  },
  {
    title: "강화용자 김회춘",
    category: "게임",
    // ⚠️ 아래 설명·태그를 실제 게임 내용으로 바꿔 주세요.
    desc: "한 번 더 누르면 될 것 같은 그 마음. 터지고 또 도전하는 강화 게임. " +
          "출시 준비 중입니다.",
    tags: ["Unity", "C#", "강화"],
    thumb: "",
    links: [
      { label: "소개 페이지", url: "upgradekim/" }
    ]
  },
  {
    title: "WebCanvas",
    category: "웹",
    desc: "이미지를 드래그하거나 Ctrl+V로 붙여넣어 자유롭게 배치·편집하는 " +
          "웹 캔버스. 텍스트·스티커 추가, 줌·팬, 정렬, 영역 캡처, " +
          "저장/불러오기를 지원합니다.",
    tags: ["JavaScript", "드래그 앤 드롭", "이미지 편집"],
    thumb: "",
    links: [
      { label: "서비스 바로가기", url: "https://webcanvas-ten.vercel.app/" }
    ]
  },
  {
    title: "이미지 개그 대결",
    category: "웹",
    desc: "이미지를 올리고 웃긴 멘트를 녹음해 대결하는 커뮤니티 서비스. " +
          "AI 이미지 생성과 Google 로그인을 지원합니다.",
    tags: ["JavaScript", "AI 이미지 생성", "커뮤니티"],
    thumb: "",
    links: [
      { label: "서비스 바로가기", url: "https://funny-image-voice.vercel.app/" }
    ]
  },
  {
    title: "DragonFly",
    category: "게임",
    desc: "좌우로 움직이며 미사일을 자동 연사하는 세로 스크롤 슈팅. " +
          "적을 처치해 모은 코인이 2개 쌓일 때마다 미사일이 한 단계씩 강해집니다.",
    tags: ["Unity", "C#", "2D 슈팅"],
    thumb: "",
    links: [
      { label: "GitHub 저장소", url: "https://github.com/modamobs/DragonFly" }
    ]
  },
  {
    title: "Pin",
    category: "게임",
    desc: "회전 속도와 방향이 수시로 바뀌는 원반에 핀을 꽂는 타이밍 게임. " +
          "목표 개수를 모두 꽂으면 클리어하고, 이미 꽂힌 핀에 부딪히면 실패합니다.",
    tags: ["Unity", "C#", "캐주얼"],
    thumb: "",
    links: [
      { label: "GitHub 저장소", url: "https://github.com/modamobs/Pin" }
    ]
  },
  {
    title: "Dodge",
    category: "게임",
    desc: "사방의 발사대가 플레이어를 조준해 총알을 쏘는 3D 생존 게임. " +
          "불규칙한 발사 간격을 읽어 피하면서 생존 시간 최고 기록을 겨룹니다.",
    tags: ["Unity", "C#", "3D", "생존"],
    thumb: "",
    links: [
      { label: "GitHub 저장소", url: "https://github.com/modamobs/Dodge" }
    ]
  },
  {
    title: "MediCheck",
    category: "앱",
    desc: "카메라로 찍은 성분표를 OCR로 읽어, 선택한 질환 기준에 맞춰 " +
          "적절·주의·부적절을 판정하는 안드로이드 앱. 분석 기록은 기기 안에 저장됩니다.",
    tags: ["Kotlin", "Jetpack Compose", "ML Kit OCR", "Room"],
    thumb: "",
    links: [
      { label: "GitHub 저장소", url: "https://github.com/modamobs/MediCheck" }
    ]
  }
];
