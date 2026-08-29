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
  }
];
