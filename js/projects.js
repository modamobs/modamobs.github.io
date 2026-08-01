/* ===================================================
   프로젝트 데이터
   ---------------------------------------------------
   여기만 수정하면 사이트에 바로 반영됩니다.

   각 항목의 필드:
     title      : 프로젝트 이름                        (필수)
     category   : "게임" | "앱" | "웹"                  (필수, 필터 버튼이 자동 생성됨)
     desc       : 한두 문장 설명                        (필수)
     tags       : 사용 기술 배열                        (선택)
     thumb      : 썸네일 이미지 경로                    (선택, 없으면 이니셜 썸네일 표시)
                  예) "assets/images/undead.png"
     links      : [{ label: "버튼 이름", url: "주소" }]  (선택)
     featured   : true면 "대표 프로젝트"로 큰 카드에 표시 (선택, 2~3개 권장)
     highlights : 대표 카드에만 표시되는 핵심 성과 목록   (선택, featured일 때)
                  예) ["혼자서 기획부터 출시까지", "다운로드 1만 회"]

   ⚠️ 아래 내용은 폴더 이름을 보고 채워 넣은 초안입니다.
      실제 설명·링크·스크린샷으로 바꿔 주세요.
   =================================================== */

const PROJECTS = [
  {
    title: "Undead",
    category: "게임",
    desc: "언데드를 소재로 한 Unity 게임. 설명을 실제 내용으로 바꿔 주세요.",
    tags: ["Unity", "C#"],
    thumb: "",
    links: []
  },
  {
    title: "Last Escape Rocket",
    category: "게임",
    desc: "로켓을 조종해 탈출하는 아케이드 게임. 설명을 실제 내용으로 바꿔 주세요.",
    tags: ["Unity", "C#", "2D"],
    thumb: "",
    links: []
  },
  {
    title: "SlotPvP",
    category: "게임",
    desc: "슬롯 기반 PvP 게임. 설명을 실제 내용으로 바꿔 주세요.",
    tags: ["Unity", "C#", "멀티플레이"],
    thumb: "",
    links: []
  },
  {
    title: "CrossSum",
    category: "게임",
    featured: true,
    desc: "같은 숫자를 상하좌우로 이어붙여 더 큰 숫자를 만드는 4×4 머지 퍼즐. " +
          "200개 스테이지의 싱글 모드에 실시간 1:1 대전과 매일 갱신되는 " +
          "챌린지 랭킹을 더했습니다.",
    highlights: [
      "싱글 200스테이지 + 실시간 1:1 대전 + 일일 챌린지 랭킹",
      "언두·해머·요술봉 아이템과 타일 커스터마이징",
      "Google Play 출시 준비 중"
    ],
    tags: ["Unity", "C#", "퍼즐", "실시간 대전"],
    thumb: "",
    links: [
      { label: "소개 페이지", url: "https://modamobs.github.io/" }
    ]
  },
  {
    title: "PickDat",
    category: "게임",
    desc: "설명을 실제 내용으로 바꿔 주세요.",
    tags: ["Unity"],
    thumb: "",
    links: []
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
    title: "MediCheck",
    category: "앱",
    desc: "복약·건강 체크 앱. 설명을 실제 내용으로 바꿔 주세요.",
    tags: ["Android", "Jetpack Compose"],
    thumb: "",
    links: []
  },
  {
    title: "ViveWatch",
    category: "앱",
    desc: "설명을 실제 내용으로 바꿔 주세요.",
    tags: ["Android"],
    thumb: "",
    links: []
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
    title: "WebImageCV",
    category: "웹",
    desc: "웹에서 이미지를 처리하는 컴퓨터 비전 도구. 설명을 실제 내용으로 바꿔 주세요.",
    tags: ["JavaScript", "OpenCV.js"],
    thumb: "",
    links: []
  },
  {
    title: "Pomodoro Todo",
    category: "웹",
    desc: "뽀모도로 타이머와 할 일 목록을 합친 웹 앱. 설명을 실제 내용으로 바꿔 주세요.",
    tags: ["JavaScript", "LocalStorage"],
    thumb: "",
    links: []
  },
  {
    title: "Notion Content Calendar",
    category: "웹",
    desc: "Notion과 연동되는 콘텐츠 캘린더. 설명을 실제 내용으로 바꿔 주세요.",
    tags: ["JavaScript", "Notion API"],
    thumb: "",
    links: []
  }
];
