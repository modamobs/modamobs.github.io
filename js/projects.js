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
    desc: "숫자 합을 맞추는 퍼즐 게임. 대표작이므로 게임의 핵심 재미와 " +
          "본인이 만든 부분을 두세 문장으로 자세히 적어 주세요.",
    highlights: [
      "핵심 성과를 적어 주세요 (예: 기획부터 출시까지 단독 개발)",
      "수치가 있으면 좋습니다 (예: 다운로드 1만 회)"
    ],
    tags: ["Unity", "퍼즐"],
    thumb: "",
    links: []
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
    title: "RelayToon",
    category: "앱",
    featured: true,
    desc: "웹툰 관련 Android 앱. 대표작이므로 어떤 서비스인지, 어떤 기능을 " +
          "직접 만들었는지 두세 문장으로 자세히 적어 주세요.",
    highlights: [
      "핵심 성과를 적어 주세요 (예: 스토어 출시, 사용자 수)",
      "사용한 핵심 기술이나 구현 포인트"
    ],
    tags: ["Android", "Kotlin"],
    thumb: "",
    links: []
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
    desc: "브라우저에서 동작하는 캔버스 드로잉 도구. 설명을 실제 내용으로 바꿔 주세요.",
    tags: ["JavaScript", "Canvas API"],
    thumb: "",
    links: []
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
