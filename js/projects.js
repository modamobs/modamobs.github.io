/* ===================================================
   프로젝트 데이터
   ---------------------------------------------------
   여기만 수정하면 사이트에 바로 반영됩니다.

   각 항목의 필드:
     title    : 프로젝트 이름                        (필수)
     category : "게임" | "앱" | "웹"                  (필수, 필터 버튼이 자동 생성됨)
     desc     : 한두 문장 설명                        (필수)
     tags     : 사용 기술 배열                        (선택)
     thumb    : 썸네일 이미지 경로                    (선택, 없으면 이니셜 썸네일 표시)
                예) "assets/images/undead.png"
     links    : [{ label: "버튼 이름", url: "주소" }]  (선택)

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
    desc: "숫자 합을 맞추는 퍼즐 게임. 설명을 실제 내용으로 바꿔 주세요.",
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
    desc: "웹툰 관련 Android 앱. 설명을 실제 내용으로 바꿔 주세요.",
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
