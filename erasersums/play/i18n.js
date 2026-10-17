/* 지우개 셈 — 말 (한국어 · English · 日本語 · 中文)
 *
 * 문구는 여기 한곳에 모은다. 한 줄에 네 나라 말을 같이 두면 빠진 번역이 눈에 바로 띈다.
 *   'key': ['한국어', 'English', '日本語', '中文'],
 *
 * 쓰는 법
 *   화면에 박힌 글: index.html 에 data-t="key" (aria 는 data-t-aria, placeholder 는 data-t-ph)
 *   코드 안에서   : T('key') · 숫자를 끼우려면 T('key', { n: 3 }) → 문구의 {n} 자리에 들어간다
 *
 * 언어는 설정에서 고르고, '자동'이면 기기 언어를 따라간다. 모르는 말이면 영어.
 */
(function () {
  'use strict';
  const St = window.Store;
  const CODES = ['ko', 'en', 'ja', 'zh'];

  const S = {
    // ── 앱·홈 ────────────────────────────────────────
    'app.name': ['지우개 셈', 'Eraser Sums', 'けしごむ算', '橡皮算术'],
    'home.solved': ['푼 판', 'Solved', 'クリア', '已完成'],
    'home.hints': ['힌트', 'Hints', 'ヒント', '提示'],
    'home.daily.kicker': ['오늘의 퍼즐', "Today's puzzle", '今日のパズル', '今日谜题'],
    'home.daily.play': ['플레이', 'Play', 'あそぶ', '开始'],
    'home.daily.done': ['오늘 완료', 'Done today', '今日はクリア', '今日已完成'],
    'home.daily.size': ['오늘은 {n}×{n}', "Today's {n}×{n}", '今日は {n}×{n}', '今天 {n}×{n}'],
    'home.daily.streak': ['연속 {n}일', '{n}-day streak', '{n}日連続', '连续 {n} 天'],
    'home.stamp': ['참<br>잘했어요', 'Well<br>done', 'よく<br>できました', '真<br>棒'],
    'home.journey.kicker': ['여정', 'Journey', '旅', '旅程'],
    'home.journey.stage': ['{n}단계', 'Stage {n}', 'ステージ {n}', '第 {n} 关'],
    'home.journey.foot': ['{c}장 · ★ {s}', 'Ch. {c} · ★ {s}', '第{c}章 · ★ {s}', '第 {c} 章 · ★ {s}'],
    'home.journey.go': ['이어가기', 'Continue', 'つづきから', '继续'],
    'home.journey.start': ['시작하기', 'Start', 'はじめる', '开始'],
    'home.mode.kicker': ['모드', 'Mode', 'モード', '模式'],
    'home.relax': ['하트 없이', 'No hearts', 'ハートなし', '无爱心'],
    'home.relax.easy': ['쉬움', 'Easy', 'かんたん', '简单'],
    'home.relax.hard': ['어려움', 'Hard', 'むずかしい', '困难'],
    'home.relax.resume': ['하던 판 이어하기 ›', 'Resume board ›', 'つづきから ›', '继续上一局 ›'],
    'home.continue': ['이어하기', 'Continue', 'つづきから', '继续'],
    'home.new': ['새 게임', 'New game', 'あたらしく', '新游戏'],
    'home.new.first': ['바로 시작하기', 'Start playing', 'すぐあそぶ', '立即开始'],
    'home.rank': ['순위', 'Ranking', 'ランキング', '排行'],
    'home.hero.kicker': ['오늘의 퍼즐 · {d} · {n}×{n}', "Today's puzzle · {d} · {n}×{n}", '今日のパズル · {d} · {n}×{n}', '今日谜题 · {d} · {n}×{n}'],
    'home.hero.title': ['오늘의 판을 풀어 보세요', "Try today's puzzle", '今日の盤を解いてみよう', '来解今天的谜题吧'],
    'home.hero.done': ['오늘 판을 다 풀었어요', "You solved today's puzzle", '今日の盤はクリア', '今天的谜题完成了'],
    'home.hero.first': ['지우개 셈을 시작해 볼까요?', 'Ready to start Eraser Sums?', 'けしごむ算をはじめよう', '开始玩橡皮算术吧？'],
    'home.dailyPlay': ['데일리 풀기', 'Play daily', 'デイリー', '每日谜题'],
    'home.dailyResume': ['데일리 이어하기', 'Resume daily', 'デイリーのつづき', '继续每日谜题'],
    'home.dailyView': ['데일리 보기', 'View daily', 'デイリーを見る', '查看每日'],
    'home.journey.sub': ['{c}장 · {n}단계 · ★ {s}', 'Ch. {c} · Stage {n} · ★ {s}', '第{c}章 · ステージ{n} · ★ {s}', '第 {c} 章 · 第 {n} 关 · ★ {s}'],
    'home.relax.sub': ['틀려도 하트가 안 줄어요', 'Mistakes cost no hearts', 'ミスしてもハートが減らない', '出错不扣爱心'],
    'home.close': ['닫기', 'Close', '閉じる', '关闭'],
    'home.relax.subResume': ['하던 판이 있어요', 'You have a board in progress', 'とちゅうの盤があります', '有未完成的一局'],
    'home.relax.pick': ['틀려도 하트가 줄지 않아요. 크기를 골라 주세요', "Mistakes don't cost hearts. Pick a size", 'ミスしてもハートは減りません。サイズを選んでね', '出错不会扣爱心，请选择尺寸'],
    'home.pick': ['크기 고르기', 'Pick a size', 'サイズを選ぶ', '选择尺寸'],

    // ── 탭 ──────────────────────────────────────────
    'tab.bar': ['탭', 'Tabs', 'タブ', '标签'],
    'tab.home': ['홈', 'Home', 'ホーム', '主页'],
    'tab.daily': ['데일리', 'Daily', 'デイリー', '每日'],
    'tab.stats': ['통계', 'Stats', 'きろく', '统计'],
    'tab.settings': ['설정', 'Settings', '設定', '设置'],

    // ── 데일리 ──────────────────────────────────────
    'daily.prev': ['이전 달', 'Previous month', '前の月', '上个月'],
    'daily.next': ['다음 달', 'Next month', '次の月', '下个月'],
    'daily.week': ['일,월,화,수,목,금,토', 'S,M,T,W,T,F,S', '日,月,火,水,木,金,土', '日,一,二,三,四,五,六'],
    'daily.count': ['이번 달 {n}일 · 연속 {s}일', '{n} this month · {s}-day streak', '今月 {n}日 · {s}日連続', '本月 {n} 天 · 连续 {s} 天'],
    'daily.play': ['{d} 퍼즐 하기 · {n}×{n}', 'Play {d} · {n}×{n}', '{d} のパズル · {n}×{n}', '玩 {d} · {n}×{n}'],
    'daily.replay': ['{d} 퍼즐 다시 하기 · {n}×{n}', 'Replay {d} · {n}×{n}', '{d} をもう一度 · {n}×{n}', '重玩 {d} · {n}×{n}'],
    'daily.note': [
      '월요일은 5×5, 주말은 7×7 — 요일마다 판 크기가 달라요.<br>하루 한 판 풀면 힌트 1개를 드려요.',
      'Mondays are 5×5, weekends 7×7 — the size changes by weekday.<br>Clear one a day and get a hint.',
      '月曜は 5×5、週末は 7×7 — 曜日でサイズが変わります。<br>1日1問クリアでヒントを1つ。',
      '周一 5×5，周末 7×7 — 每天尺寸不同。<br>每天完成一局可得 1 个提示。',
    ],

    // ── 통계 ────────────────────────────────────────
    'stats.solved': ['푼 판', 'Puzzles solved', 'クリアした数', '完成局数'],
    'stats.perfect': ['실수 없이 푼 판', 'Solved with no mistakes', 'ノーミスでクリア', '零失误完成'],
    'stats.level': ['깬 단계', 'Stages cleared', 'クリアしたステージ', '通关数'],
    'stats.streak': ['데일리 연속', 'Daily streak', 'デイリー連続', '每日连续'],
    'stats.best': ['크기별 최고 기록', 'Best time by size', 'サイズ別ベスト', '各尺寸最佳'],
    'stats.none': ['아직 없어요', 'Nothing yet', 'まだありません', '还没有记录'],
    'games.title': ['Play 게임즈', 'Play Games', 'Play ゲーム', 'Play 游戏'],
    'games.guest': ['연결하면 순위표에 오르고, 폰을 바꿔도 기록이 이어져요.', 'Connect to join the leaderboard and keep your progress on a new phone.', '連携するとランキングに参加でき、機種変更しても記録を引き継げます。', '连接后可以上排行榜，换手机也能继续进度。'],
    'games.who': ['{n} 님으로 연결됐어요', 'Signed in as {n}', '{n} さんで連携中', '已连接：{n}'],
    'games.on': ['연결됐어요', 'Connected', '連携中', '已连接'],
    'games.connect': ['구글 계정 연결', 'Connect Google account', 'Google アカウントと連携', '连接 Google 账号'],
    'games.board': ['순위표', 'Leaderboard', 'ランキング', '排行榜'],
    'games.ach': ['업적', 'Achievements', '実績', '成就'],
    'toss.lb.title': ['토스 게임센터', 'Toss Game Center', 'Toss ゲームセンター', 'Toss 游戏中心'],
    'toss.lb.desc': ['여정에서 모은 별 {n}개로 순위가 매겨져요.', 'Ranked by your {n} Journey stars.', '旅で集めた星 {n} 個でランキングされます。', '按旅程中收集的 {n} 颗星排名。'],
    'toss.lb.noProfile': ['순위표를 한 번 열어 게임 프로필을 만들면 순위에 이름이 올라가요.', 'Open the leaderboard once to create a game profile and join the ranking.', 'ランキングを一度開いてゲームプロフィールを作ると参加できます。', '打开一次排行榜创建游戏资料后即可上榜。'],
    'toss.promo.first': ['이 판을 깨면 토스포인트 {n}원을 받아요', 'Clear this puzzle to get {n} Toss Points', 'このパズルをクリアすると Toss ポイント {n} ウォンもらえます', '完成本局可获得 {n} 韩元 Toss 积分'],
    'toss.promo.next': ['오늘 한 판 깨면 토스포인트 {n}원을 받아요', 'Clear a puzzle today to get {n} Toss Points', '今日1つクリアすると Toss ポイント {n} ウォンもらえます', '今天完成一局可获得 {n} 韩元 Toss 积分'],
    'toss.promo.three': ['세 판 깰 때마다 토스포인트 {n}원을 받아요 (하루 {m}원까지)', 'Get {n} Toss Points for every 3 puzzles you clear (up to {m} a day)', '3つクリアするごとに Toss ポイント {n} ウォン(1日 {m} ウォンまで)', '每完成 3 局可获得 {n} 韩元 Toss 积分(每天最多 {m} 韩元)'],
    'toss.promo.threeLeft': ['{k}판 더 깨면 토스포인트 {n}원을 받아요', 'Clear {k} more to get {n} Toss Points', 'あと {k} つクリアで Toss ポイント {n} ウォン', '再完成 {k} 局可获得 {n} 韩元 Toss 积分'],
    'toss.promo.got': ['토스포인트 {n}원을 받았어요', 'You got {n} Toss Points', 'Toss ポイント {n} ウォンを受け取りました', '已获得 {n} 韩元 Toss 积分'],
    'games.saveDesc': ['여정 별 {n}개', 'Journey stars: {n}', '旅の星 {n} 個', '旅程星星 {n} 颗'],

    // ── 설정 ────────────────────────────────────────
    'set.sound': ['소리', 'Sound', '音', '声音'],
    'set.vibe': ['진동', 'Vibration', 'バイブ', '振动'],
    'set.left': ['남은 합 보기', 'Show remaining sum', '残りの合計を表示', '显示剩余和'],
    'set.left.desc': ['동그라미 친 만큼 줄 합에서 빼서 보여 줘요', 'Line sums count down as you circle numbers', '丸をつけた分だけ合計から引いて表示します', '圈出的数字会从总和中扣除显示'],
    'set.auto': ['자동 지우기', 'Auto-erase', '自動で消す', '自动擦除'],
    'set.auto.desc': [
      '남길 숫자를 다 고르면 그 줄의 나머지를 지워요',
      'Once every keeper is circled, the rest of the line is erased',
      '残す数を選び終えると、その列の残りを消します',
      '圈完要保留的数字后，自动擦掉该行其余数字',
    ],
    'set.theme': ['화면', 'Display', '画面', '显示'],
    'set.theme.light': ['밝게', 'Light', 'ライト', '浅色'],
    'set.theme.dark': ['어둡게', 'Dark', 'ダーク', '深色'],
    'set.lang': ['언어', 'Language', '言語', '语言'],
    'set.lang.auto': ['기기 설정', 'System', '端末に合わせる', '跟随系统'],
    'set.how': ['게임 방법', 'How to play', 'あそびかた', '玩法'],
    'set.move': ['단계 옮기기', 'Jump stage', 'ステージ移動', '跳关'],
    'set.move.desc': ['개발용', 'Dev only', '開発用', '开发用'],
    'set.prev': ['이전 레벨', 'Previous level', '前のレベル', '上一级'],
    'set.next': ['다음 레벨', 'Next level', '次のレベル', '下一级'],

    // ── 판 ──────────────────────────────────────────
    'game.back': ['홈으로', 'Back home', 'ホームへ', '返回主页'],
    'game.settings': ['설정', 'Settings', '設定', '设置'],
    'game.hearts': ['남은 하트', 'Hearts left', '残りハート', '剩余爱心'],
    'game.relaxNote': ['틀려도 하트가 줄지 않아요', 'Mistakes cost no hearts', 'まちがえてもハートは減りません', '答错不扣爱心'],
    'game.tools': ['도구', 'Tools', '道具', '工具'],
    'game.erase': ['지우기', 'Erase', 'けす', '擦除'],
    'game.keep': ['남기기', 'Keep', 'のこす', '保留'],
    'game.hint': ['힌트', 'Hint', 'ヒント', '提示'],
    'game.title.stage': ['{n}단계', 'Stage {n}', 'ステージ {n}', '第 {n} 关'],
    'game.title.free': ['새 게임', 'New game', 'あたらしく', '新游戏'],
    'game.mission': ['미션 · {t}', 'Mission · {t}', 'ミッション · {t}', '任务 · {t}'],

    // ── 여정 ────────────────────────────────────────
    'journey.title': ['여정', 'Journey', '旅', '旅程'],
    'journey.locked': ['앞 단계를 먼저 깨 주세요', 'Clear the earlier stage first', '前のステージを先にクリアしてください', '请先通过前面的关卡'],
    'journey.chapter': ['{n}장', 'Chapter {n}', '第{n}章', '第 {n} 章'],
    'journey.chapterStars': ['{n}장 {t}', 'Ch. {n} {t}', '第{n}章 {t}', '第 {n} 章 {t}'],
    'journey.reward': ['{n}장 완료 보상: 힌트 +{h}', 'Chapter {n} reward: +{h} hints', '第{n}章クリア報酬: ヒント +{h}', '第 {n} 章奖励：提示 +{h}'],

    // ── 판 안의 설정 창 ─────────────────────────────
    'sheet.restart': ['이 판 처음부터', 'Restart this board', 'この問題を最初から', '重新开始本局'],
    'sheet.code': ['이 판 도전 코드', 'Challenge code', 'チャレンジコード', '挑战码'],
    'sheet.code.desc': [
      '친구에게 보내면 같은 판을 풀 수 있어요 · 누르면 복사',
      'Send it to a friend to share this exact board · tap to copy',
      '友だちに送ると同じ問題で遊べます · タップでコピー',
      '发给朋友即可玩同一局 · 点按复制',
    ],
    'sheet.stage': ['단계 옮기기', 'Jump stage', 'ステージ移動', '跳关'],
    'sheet.prevStage': ['이전 단계', 'Previous stage', '前のステージ', '上一关'],
    'sheet.nextStage': ['다음 단계', 'Next stage', '次のステージ', '下一关'],
    'sheet.close': ['닫기', 'Close', 'とじる', '关闭'],
    'sheet.copied': ['도전 코드를 복사했어요', 'Challenge code copied', 'チャレンジコードをコピーしました', '挑战码已复制'],

    // ── 새 게임 창 ──────────────────────────────────
    'new.title': ['새 게임', 'New game', 'あたらしく', '新游戏'],
    'new.rec': ['추천', 'Suggested', 'おすすめ', '推荐'],
    'new.size.5': ['쉬움', 'Easy', 'かんたん', '简单'],
    'new.size.6': ['보통', 'Normal', 'ふつう', '普通'],
    'new.size.7': ['어려움', 'Hard', 'むずかしい', '困难'],
    'new.size.8': ['전문가', 'Expert', 'エキスパート', '专家'],
    'new.size.9': ['익스트림', 'Extreme', 'エクストリーム', '极限'],
    'new.code.label': ['친구가 보낸 도전 코드가 있나요?', 'Got a challenge code from a friend?', '友だちからのコードがありますか?', '有朋友给的挑战码吗？'],
    'new.code.ph': ['예: E6-1K3QZ9', 'e.g. E6-1K3QZ9', '例: E6-1K3QZ9', '例：E6-1K3QZ9'],
    'new.code.go': ['도전 시작', 'Start', 'スタート', '开始'],
    'new.code.bad': [
      '코드를 다시 확인해 주세요. E 다음에 판 크기(5~9)가 와요.',
      'Check the code — E is followed by the board size (5-9).',
      'コードを確認してください。E の次にサイズ(5〜9)が入ります。',
      '请检查挑战码：E 后面是尺寸（5~9）。',
    ],

    // ── 게임 방법 ───────────────────────────────────
    'how.title': ['게임 방법', 'How to play', 'あそびかた', '玩法'],
    'how.1': [
      '줄 바깥 숫자는 그 줄에 <b>남은 숫자의 합</b>이에요. 누르면 지금 동그라미 합을 알려 줘요.',
      'The number outside a line is the <b>sum of the numbers left</b> in it. Tap it to see your current sum.',
      '列の外の数は、その列に<b>残す数の合計</b>です。タップすると今の合計が出ます。',
      '行外的数字是该行<b>保留数字之和</b>。点一下可看当前的和。',
    ],
    'how.2': [
      '<b>색깔 묶음</b> 왼쪽 위의 작은 숫자는 그 묶음에 남길 숫자의 합이에요.',
      'The small number in a <b>colored block</b> is the sum to leave in that block.',
      '<b>色のかたまり</b>の左上の小さい数は、そこに残す数の合計です。',
      '<b>彩色区块</b>左上角的小数字，是该区块要保留的和。',
    ],
    'how.3': [
      '<b>지우기</b>로 필요 없는 숫자를 지우고, <b>남기기</b>로 꼭 남을 숫자에 동그라미를 쳐요.',
      'Use <b>Erase</b> on numbers you do not need, and <b>Keep</b> to circle the ones that stay.',
      '<b>けす</b>でいらない数を消し、<b>のこす</b>で残す数に丸をつけます。',
      '用<b>擦除</b>去掉多余数字，用<b>保留</b>圈出要留下的。',
    ],
    'how.4': [
      '틀리면 하트가 하나 줄어요. 세 개를 다 쓰면 끝나요. <b>하트 없이</b> 모드는 줄지 않아요.',
      'A mistake costs a heart. Three mistakes end the board. <b>No hearts</b> mode never costs any.',
      'まちがえるとハートが1つ減ります。3つでおわり。<b>ハートなし</b>では減りません。',
      '答错扣一个爱心，三个用完本局结束。<b>无爱心</b>模式不扣。',
    ],
    'how.5': [
      '막히면 <b>힌트</b>. 어느 줄을 보면 되는지도 알려 줘요.',
      'Stuck? Take a <b>hint</b> — it also points at the line to look at.',
      'つまったら<b>ヒント</b>。どの列を見ればいいかも教えます。',
      '卡住就用<b>提示</b>，它还会指出该看哪一行。',
    ],
    'how.ok': ['알겠어요', 'Got it', 'わかりました', '知道了'],
    'how.again': ['튜토리얼 다시 보기', 'Replay the tutorial', 'チュートリアルをもう一度', '重看教程'],
    'how.again.toast': [
      '다음에 여는 판에서 다시 알려 줄게요',
      'The next board will walk you through it',
      '次の問題でもう一度ご案内します',
      '下一局会再带你走一遍',
    ],

    // ── 판 안내 글(여정 앞 단계) ────────────────────
    'tip.1': [
      '가로·세로 줄에 남은 숫자를 더하면 바깥 숫자가 되도록, 필요 없는 숫자를 지워 보세요.',
      'Erase the numbers you do not need so each line adds up to the number outside it.',
      '外の数になるように、いらない数を消しましょう。',
      '擦掉多余的数字，让每行剩下的数字之和等于行外的数。',
    ],
    'tip.2': [
      '꼭 남아야 할 숫자는 ‘남기기’로 동그라미 쳐 두면 헷갈리지 않아요.',
      'Circle the numbers that must stay with Keep — it saves you from second-guessing.',
      '残す数は「のこす」で丸をつけておくと迷いません。',
      '用「保留」圈出必须留下的数字，就不会搞混。',
    ],
    'tip.3': [
      '한 줄을 다 맞추면 나머지 칸은 저절로 채워져요.',
      'Finish one line and the rest of its cells fill themselves in.',
      '1列そろうと、残りのマスは自動で決まります。',
      '一行完成后，其余格子会自动填好。',
    ],
    'tip.4': [
      '줄 바깥의 합 숫자를 누르면 지금 동그라미 친 합을 알려 줘요.',
      'Tap the sum outside a line to see what you have circled so far.',
      '外の合計をタップすると、今の丸の合計が分かります。',
      '点行外的和，可以看到已圈数字的合计。',
    ],

    // ── 결과 창 ─────────────────────────────────────
    'win.stage': ['{n}단계 완료!', 'Stage {n} cleared!', 'ステージ {n} クリア!', '第 {n} 关通过！'],
    'win.daily': ['{d} 퍼즐 완료', '{d} puzzle cleared', '{d} のパズル クリア', '{d} 谜题完成'],
    'win.free': ['다 풀었어요', 'Solved!', 'ぜんぶ解けました', '全部解开了'],
    'win.body': ['{t} · 실수 {m}', '{t} · {m} mistakes', '{t} · ミス {m}', '{t} · 失误 {m}'],
    'win.hints': [' · 힌트 {h}', ' · {h} hints', ' · ヒント {h}', ' · 提示 {h}'],
    'win.mission': ['🎯 {t} — {r}', '🎯 {t} — {r}', '🎯 {t} — {r}', '🎯 {t} — {r}'],
    'win.mission.ok': ['성공', 'done', '達成', '达成'],
    'win.mission.no': ['못 지켰어요', 'missed', '未達成', '未达成'],
    'win.better': ['별이 늘었어요! (★ {n})', 'More stars! (★ {n})', '星が増えました! (★ {n})', '星星变多了！(★ {n})'],
    'win.best': ['이 단계 최고 기록은 ★ {n}예요.', 'Your best on this stage is ★ {n}.', 'このステージのベストは ★ {n} です。', '本关最好成绩是 ★ {n}。'],
    'win.dailyGift': ['데일리 선물로 힌트 1개를 받았어요.', 'Daily gift: 1 hint.', 'デイリーのごほうびにヒント1つ。', '每日礼物：1 个提示。'],
    'win.sizeLv': ['{n}×{n} Lv{lv} · ★ {s}/{t}', '{n}×{n} Lv{lv} · ★ {s}/{t}', '{n}×{n} Lv{lv} · ★ {s}/{t}', '{n}×{n} Lv{lv} · ★ {s}/{t}'],
    'win.code': ['도전 코드 {c}', 'Challenge code {c}', 'チャレンジコード {c}', '挑战码 {c}'],
    'act.home': ['홈으로', 'Home', 'ホームへ', '返回主页'],
    'act.next': ['{n}단계 하기', 'Play stage {n}', 'ステージ {n} へ', '进入第 {n} 关'],
    'act.map': ['지도 보기', 'See the map', '地図を見る', '查看地图'],
    'act.more': ['한 판 더', 'One more', 'もう一回', '再来一局'],
    'act.restart': ['처음부터 다시', 'Start over', 'さいしょから', '重新开始'],
    'act.adContinue': ['광고 보고 이어하기', 'Watch an ad to continue', '広告を見てつづける', '看广告继续'],
    'lose.title': ['하트를 다 썼어요', 'Out of hearts', 'ハートがなくなりました', '爱心用完了'],
    'lose.body': [
      '광고를 보면 하트 1개로 이어서 할 수 있어요.',
      'Watch an ad to continue with one heart.',
      '広告を見るとハート1つでつづけられます。',
      '看一个广告可获得 1 个爱心继续。',
    ],
    'lose.web': [
      '<span class="note">이 화면(웹)에서는 광고 없이 바로 드려요.</span>',
      '<span class="note">Here on the web you get it without an ad.</span>',
      '<span class="note">ウェブ版では広告なしで差し上げます。</span>',
      '<span class="note">网页版无需广告，直接给你。</span>',
    ],

    // ── 광고 안내 ───────────────────────────────────
    'ad.hint': ['광고를 보면 힌트 {n}개를 드려요', 'Watch an ad for {n} hints', '広告を見るとヒント{n}つ', '看广告得 {n} 个提示'],
    'ad.hintGot': ['힌트 {n}개를 받아 하나 썼어요 · 남은 힌트 {left}개', 'Got {n} hints and used one · {left} left', 'ヒントを{n}つもらって1つ使いました · 残り{left}', '获得 {n} 个提示并用了 1 个 · 剩余 {left} 个'],
    'ad.hintFail': ['광고를 끝까지 봐야 힌트를 받아요', 'Watch the whole ad to get the hint', '最後まで見るとヒントがもらえます', '看完整个广告才能获得提示'],
    'ad.hintWeb': [
      '여기서 보상형 광고가 나와요. 웹에서는 바로 힌트를 드려요.',
      'A rewarded ad would play here. On the web you just get the hint.',
      'ここで動画広告が流れます。ウェブではそのままヒントを差し上げます。',
      '此处会播放激励广告。网页版直接给你提示。',
    ],
    'ad.noFill': [
      '지금은 볼 광고가 없어요. 잠시 뒤에 다시 해 주세요',
      'No ad available right now — try again in a moment',
      'いま見られる広告がありません。少しあとでもう一度',
      '暂时没有可看的广告，请稍后再试',
    ],
    'ad.contFail': ['광고를 끝까지 봐야 이어서 할 수 있어요', 'Watch the whole ad to continue', '最後まで見るとつづけられます', '看完整个广告才能继续'],

    // ── 합 말풍선 ───────────────────────────────────
    'bub.row': ['이 가로줄', 'this row', 'この横の列', '这一横行'],
    'bub.col': ['이 세로줄', 'this column', 'この縦の列', '这一竖列'],
    'bub.region': ['이 색깔 묶음', 'this block', 'この色のかたまり', '这个彩色区块'],
    'bub.done': ['{w}은 다 맞췄어요', 'You have finished {w}', '{w}はそろいました', '{w}已完成'],
    'bub.need': [
      '{w}에 남길 숫자를 더하면 <b>{t}</b>{j} 돼요',
      'The numbers left in {w} must add up to <b>{t}</b>',
      '{w}に残す数の合計は <b>{t}</b> です',
      '{w}保留的数字之和要等于 <b>{t}</b>',
    ],
    'bub.sub': [
      '<small>지금 동그라미 합 {s} · 모르는 칸 {n}개</small>',
      '<small>Circled so far {s} · {n} cells undecided</small>',
      '<small>今の丸の合計 {s} · 未決定 {n} マス</small>',
      '<small>已圈合计 {s} · 待定 {n} 格</small>',
    ],

    // ── 알림 ────────────────────────────────────────
    'toast.code': ['도전 코드 {c} 를 복사했어요', 'Copied challenge code {c}', 'チャレンジコード {c} をコピーしました', '已复制挑战码 {c}'],
    'toast.codeShow': ['도전 코드: {c}', 'Challenge code: {c}', 'チャレンジコード: {c}', '挑战码：{c}'],
    'toast.jump': ['{n}단계 · {s}×{s}', 'Stage {n} · {s}×{s}', 'ステージ {n} · {s}×{s}', '第 {n} 关 · {s}×{s}'],

    // ── 여정 지도 ───────────────────────────────────
    'journey.here': ['여기', 'here', 'ここ', '这里'],
    'journey.starsAria': ['별 {n}개', '{n} stars', '星 {n}個', '{n} 颗星'],
    'journey.bossTag': ['힌트 +{n}', '+{n} hints', 'ヒント +{n}', '提示 +{n}'],
    'mission.noHint': ['힌트 없이 깨기', 'Clear with no hints', 'ヒントなしでクリア', '不用提示通关'],
    'mission.noMistake': ['실수 없이 깨기', 'Clear with no mistakes', 'ノーミスでクリア', '零失误通关'],
    'mission.timed': ['{n}분 안에 깨기', 'Clear within {n} min', '{n}分以内にクリア', '{n} 分钟内通关'],

    // ── 여정 장 이름 ────────────────────────────────
    'theme.rapeseed': ['유채꽃 들판', 'Canola Fields', '菜の花畑', '油菜花田'],
    'theme.blossom': ['벚꽃길', 'Cherry Blossom Lane', '桜並木', '樱花路'],
    'theme.beach': ['여름 바닷가', 'Summer Shore', '夏の海辺', '夏日海滨'],
    'theme.paddy': ['논밭 마을', 'Rice Paddy Village', '田んぼの村', '稻田村庄'],
    'theme.sunflower': ['해바라기 언덕', 'Sunflower Hill', 'ひまわりの丘', '向日葵山丘'],
    'theme.hanok': ['한옥 마을', 'Hanok Village', '韓屋の村', '韩屋村'],
    'theme.maple': ['단풍 산길', 'Maple Trail', '紅葉の山道', '红叶山路'],
    'theme.reed': ['억새 들판', 'Silver Grass Field', 'ススキの原', '芒草原野'],
    'theme.snow': ['눈 마을', 'Snow Village', '雪の村', '雪村'],
    'theme.lighthouse': ['등대 섬', 'Lighthouse Isle', '灯台の島', '灯塔岛'],
    'theme.camp': ['별빛 캠핑', 'Starlit Camp', '星空キャンプ', '星光露营'],
    'theme.lotus': ['연꽃 연못', 'Lotus Pond', '蓮の池', '荷花池'],

    // ── 첫 판 안내 ──────────────────────────────────
    'tut.1': [
      '줄 바깥의 숫자를 눌러 보세요. 그 줄에 남길 숫자의 합이에요.',
      'Tap the number outside the line. It is the sum to leave in that line.',
      '列の外の数をタップ。その列に残す合計です。',
      '点一下行外的数字，那是该行要保留的和。',
    ],
    'tut.2': [
      '이 칸은 지워야 해요. 지우개로 눌러 보세요.',
      'This one has to go. Tap it with the eraser.',
      'このマスは消します。けしごむでタップ。',
      '这一格要擦掉，用橡皮点它。',
    ],
    'tut.3': [
      '이번엔 남길 숫자예요. 아래에서 ‘남기기’로 바꿔 주세요.',
      'This next one stays. Switch to Keep below.',
      '次は残す数です。下の「のこす」に切りかえて。',
      '接下来这个要保留，请切换到下面的「保留」。',
    ],
    'tut.4': ['이 칸을 눌러 동그라미를 쳐요.', 'Tap this cell to circle it.', 'このマスをタップして丸をつけます。', '点这一格圈起来。'],
    'tut.5': [
      '이제 알겠죠? 나머지는 직접 해 보세요. 한 줄에서 지울 숫자를 다 지우면 남은 숫자에는 저절로 동그라미가 쳐져요.',
      'You have got it. Take it from here — erase every extra number in a line and the rest get circled for you.',
      'もう大丈夫。あとはご自由に — 1列の消す数をぜんぶ消すと、残りに自動で丸がつきます。',
      '会了吧？剩下的自己来 — 把一行里该擦的数字都擦掉，剩下的会自动圈起来。',
    ],
    'tut.region': [
      '같은 색 칸끼리는 한 묶음이에요. 왼쪽 위의 작은 숫자는 그 묶음에 남길 숫자의 합이에요. 가로·세로·묶음의 합이 모두 맞아야 끝나요.',
      'Cells of the same color form a block. The small number in its top-left corner is the sum to keep in that block. Rows, columns and blocks must all add up.',
      '同じ色のマスはひとつのかたまりです。左上の小さな数は、そのかたまりに残す数の合計。縦・横・かたまりの合計がすべて合えばクリアです。',
      '同色的格子是一个区块。左上角的小数字是该区块要保留的数字之和。行、列和区块的和都对上才算完成。',
    ],
    'tut.skip': ['건너뛰기', 'Skip', 'スキップ', '跳过'],
    'tut.ok': ['알겠어요', 'Got it', 'わかった', '知道了'],

    // ── 새 버전 띠 ──────────────────────────────────
    'up.ready': ['업데이트를 다 받았어요', 'Update downloaded', 'ダウンロード完了', '更新已下载'],
    'up.downloading': ['새 버전을 받는 중이에요', 'Downloading the new version', '新しいバージョンを取得中', '正在下载新版本'],
    // ── 친구 초대 (invite.js) ──
    'share.btn': ['친구에게 보내기', 'Send to a friend', '友だちに送る', '发给朋友'],
    'share.row': ['친구와 같은 판 풀기', 'Play this board with a friend', '友だちと同じ盤を解く', '和朋友玩同一盘'],
    'share.row.desc': ['토스 링크로 보내면 누르는 순간 이 판이 열려요', 'They open this exact board from the link', 'リンクを開くとこの盤がそのまま始まります', '朋友点开链接就能玩这一盘'],
    'share.won': [
      '지우개 셈 {n}×{n} 판을 {t}, 실수 {m}번으로 풀었어요! 같은 판에 도전해 볼래요? (도전 코드 {c})\n{link}',
      'I solved an Eraser Sums {n}×{n} board in {t} with {m} mistakes! Can you beat it? (code {c})\n{link}',
      'けしごむ算 {n}×{n} を {t}・ミス{m}回で解きました！同じ盤に挑戦してみて（コード {c}）\n{link}',
      '我在橡皮算术里用 {t}、失误 {m} 次完成了 {n}×{n} 的盘面！来挑战同一盘吧（代码 {c}）\n{link}',
    ],
    'share.board': [
      '지우개 셈 {n}×{n} — 이 판 같이 풀어볼래요? (도전 코드 {c})\n{link}',
      'Eraser Sums {n}×{n} — want to solve this board together? (code {c})\n{link}',
      'けしごむ算 {n}×{n} — この盤、一緒に解いてみない？（コード {c}）\n{link}',
      '橡皮算术 {n}×{n} — 一起来玩这盘吧？（代码 {c}）\n{link}',
    ],
    'share.fail': ['보내지 못했어요. 다시 해 주세요', 'Couldn’t send. Please try again', '送れませんでした。もう一度どうぞ', '发送失败，请再试一次'],
    'share.opened': ['친구가 보낸 판이에요. 같은 판을 풀어 보세요!', 'A friend sent you this board. Give it a try!', '友だちが送った盤です。解いてみよう！', '这是朋友发来的盘面，来试试吧！'],

    // ── 수상·업적 (awards.js · achievements.js) ──
    'awards.title': ['수상', 'Awards', 'トロフィー', '奖杯'],
    'awards.tab.ach': ['업적', 'Achievements', '実績', '成就'],
    'awards.sum': ['업적 {d}/{t} 달성', '{d}/{t} achievements', '実績 {d}/{t} 達成', '已达成 {d}/{t} 项成就'],
    'awards.battleEmpty': ['대결을 하면 달마다 배지가 생겨요', 'Play battles to earn a badge every month', '対戦すると毎月バッジがもらえます', '参加对战，每月都会获得徽章'],
    'awards.month': ['{m}월', 'Month {m}', '{m}月', '{m}月'],
    'awards.got': ['달성했어요', 'Unlocked', '達成しました', '已达成'],
    'awards.progress': ['{c} / {t}', '{c} / {t}', '{c} / {t}', '{c} / {t}'],
    'ach.more': ['외 업적 {n}개는 수상에서 볼 수 있어요', '+{n} more in Awards', 'ほか{n}個はトロフィー画面で', '另有 {n} 项可在奖杯中查看'],
    'ach.unlocked': ['업적 달성 · {n}', 'Achievement · {n}', '実績達成 · {n}', '成就达成 · {n}'],
    // ── 월간 패스 (pass.js, 스도쿠 문구를 따라) ──
    'pass.title': ['월간 패스', 'Monthly Pass', '月間パス', '月度通行证'],
    'pass.month': ['{m}월 패스', 'Month {m} Pass', '{m}月のパス', '{m}月通行证'],
    'pass.leftDays': ['{d}일 {h}시간 남음', '{d}d {h}h left', '残り{d}日{h}時間', '剩余 {d} 天 {h} 小时'],
    'pass.leftHours': ['{h}시간 {m}분 남음', '{h}h {m}m left', '残り{h}時間{m}分', '剩余 {h} 小时 {m} 分'],
    'pass.stars': ['모은 별', 'Stars', '集めた星', '已收集星星'],
    'pass.next': ['다음 보상까지 별 {n}개', '{n} stars to the next reward', '次の報酬まで星{n}個', '距下一个奖励还差 {n} 颗星'],
    'pass.allOpen': ['이번 달 보상을 다 열었어요', "You've unlocked every reward this month", '今月の報酬をすべて開けました', '本月奖励已全部解锁'],
    'pass.ready': ['받을 보상 {n}개', '{n} to claim', '報酬{n}個', '{n} 个可领取'],
    'pass.toNext': ['다음 보상까지 ★{n}', '★{n} to next', '次まで★{n}', '距下一个 ★{n}'],
    'pass.allShort': ['보상 다 열림', 'All unlocked', 'すべて開放', '已全部解锁'],
    'pass.how': ['깨면 별 · 한 판 ★1 · 실수 없이 ★1 더 · 오늘의 퍼즐 ★2 더', 'Stars for every clear · 1 per puzzle · +1 with no mistakes · +2 for the daily puzzle', 'クリアで星 · 1問★1 · ミスなし★1追加 · 今日のパズル★2追加', '完成得星 · 每局 ★1 · 无失误 +★1 · 每日谜题 +★2'],
    'pass.reset': ['매달 1일에 새로 시작해요. 못 받은 힌트는 다음 달에 알아서 들어가요.', 'Resets on the 1st of each month. Unclaimed hints are added for you.', '毎月1日にリセット。受け取っていないヒントは自動で追加されます。', '每月 1 日重新开始，未领取的提示会自动补发。'],
    'pass.hints': ['힌트 ×{n}', 'Hint ×{n}', 'ヒント ×{n}', '提示 ×{n}'],
    'pass.points': ['토스포인트 {n}원', '{n} Toss Points', 'Toss ポイント {n} ウォン', '{n} 韩元 Toss 积分'],
    'pass.tossGoal': ['별 {g}개를 모으면 토스포인트 {n}원!', 'Collect {g} stars for {n} Toss Points!', '星{g}個で Toss ポイント {n} ウォン!', '集满 {g} 颗星可获得 {n} 韩元 Toss 积分！'],
    'pass.tossRetry': ['포인트 받기', 'Get points', 'ポイントを受け取る', '领取积分'],
    'pass.claim': ['받기', 'Claim', '受け取る', '领取'],
    'pass.claimAll': ['모두 받기 {n}', 'Claim all {n}', 'すべて受け取る {n}', '全部领取 {n}'],
    'pass.gotHints': ['힌트 {n}개를 받았어요', 'You got {n} hints', 'ヒントを{n}個もらいました', '获得 {n} 个提示'],
    'pass.fail': ['지금은 받을 수 없어요. 잠시 뒤에 다시 눌러 주세요', "Couldn't claim right now. Please try again later", '今は受け取れません。しばらくしてからもう一度', '暂时无法领取，请稍后再试'],
    'pass.earned': ['패스 별 +{n}', 'Pass stars +{n}', 'パスの星 +{n}', '通行证星星 +{n}'],
    'pass.opened': ['패스 보상 {n}개 도착!', '{n} pass rewards unlocked!', 'パス報酬{n}個到着!', '解锁 {n} 个通行证奖励！'],
    'pass.late': ['지난달 패스에서 못 받은 힌트 {n}개를 넣어 드렸어요', "Added {n} hints you didn't claim from last month's pass", '先月のパスで受け取っていないヒント{n}個を追加しました', '已补发上月通行证中未领取的 {n} 个提示'],
    'awards.tab.month': ['월간', 'Monthly', '月間', '月度'],
    'awards.monthDays': ['{d}/{t}일', '{d}/{t} days', '{d}/{t}日', '{d}/{t} 天'],
    'awards.monthNext': ['{t}까지 {n}일', '{n} days to {t}', '{t}まであと{n}日', '距{t}还差 {n} 天'],
    'awards.monthHow': ['그달 오늘의 퍼즐을 10일 풀면 동, 20일이면 은, 하루도 안 빼면 금 트로피예요', 'Solve the daily puzzle 10 days in a month for bronze, 20 for silver, every day for gold', 'その月の今日のパズルを10日で銅、20日で銀、毎日で金トロフィー', '当月完成每日谜题 10 天得铜杯，20 天得银杯，每天都完成得金杯'],
    'awards.tier.bronze': ['동', 'bronze', '銅', '铜杯'],
    'awards.tier.silver': ['은', 'silver', '銀', '银杯'],
    'awards.tier.gold': ['금', 'gold', '金', '金杯'],
    'ach.first_win': ['첫 승리', 'First win', '初勝利', '首胜'],
    'ach.first_win.d': ['판을 처음으로 다 풀기', 'Solve your first puzzle', 'はじめてパズルを解く', '第一次完成一局'],
    'ach.no_hint_win': ['혼자 힘으로', 'On my own', '自力で', '独立完成'],
    'ach.no_hint_win.d': ['힌트 없이 판 하나 풀기', 'Solve a puzzle without hints', 'ヒントなしで1つ解く', '不用提示完成一局'],
    'ach.solved_10': ['열 판', 'Ten down', '10問', '十局'],
    'ach.solved_10.d': ['판 10개 풀기', 'Solve 10 puzzles', '10問解く', '完成 10 局'],
    'ach.solved_50': ['쉰 판', 'Fifty down', '50問', '五十局'],
    'ach.solved_50.d': ['판 50개 풀기', 'Solve 50 puzzles', '50問解く', '完成 50 局'],
    'ach.solved_200': ['이백 판', 'Two hundred', '200問', '两百局'],
    'ach.solved_200.d': ['판 200개 풀기', 'Solve 200 puzzles', '200問解く', '完成 200 局'],
    'ach.solved_500': ['오백 판', 'Five hundred', '500問', '五百局'],
    'ach.solved_500.d': ['판 500개 풀기', 'Solve 500 puzzles', '500問解く', '完成 500 局'],
    'ach.perfect_5': ['깔끔하게', 'Clean', 'ノーミス', '零失误'],
    'ach.perfect_5.d': ['실수 없이 5판 풀기', 'Solve 5 puzzles with no mistakes', 'ノーミスで5問解く', '零失误完成 5 局'],
    'ach.perfect_25': ['완벽주의', 'Perfectionist', '完璧主義', '完美主义'],
    'ach.perfect_25.d': ['실수 없이 25판 풀기', 'Solve 25 puzzles with no mistakes', 'ノーミスで25問解く', '零失误完成 25 局'],
    'ach.regions_first': ['색깔 묶음', 'Colored blocks', '色のかたまり', '彩色区块'],
    'ach.regions_first.d': ['색깔 묶음이 있는 판(6×6부터) 풀기', 'Solve a board with colored blocks (6×6 and up)', '色のかたまりがある盤(6×6から)を解く', '完成一局有彩色区块的盘面（6×6 起）'],
    'ach.size_7': ['7×7 정복', '7×7 cleared', '7×7 制覇', '征服 7×7'],
    'ach.size_7.d': ['7×7 판 풀기', 'Solve a 7×7 board', '7×7を解く', '完成一局 7×7'],
    'ach.size_8': ['8×8 정복', '8×8 cleared', '8×8 制覇', '征服 8×8'],
    'ach.size_8.d': ['8×8 판 풀기', 'Solve an 8×8 board', '8×8を解く', '完成一局 8×8'],
    'ach.size_9': ['9×9 정복', '9×9 cleared', '9×9 制覇', '征服 9×9'],
    'ach.size_9.d': ['9×9 판 풀기', 'Solve a 9×9 board', '9×9を解く', '完成一局 9×9'],
    'ach.size9_10': ['큰 판 고수', 'Big board pro', '大盤の達人', '大盘高手'],
    'ach.size9_10.d': ['9×9 판 10개 풀기', 'Solve 10 boards of 9×9', '9×9を10問解く', '完成 10 局 9×9'],
    'ach.fast_7': ['빠른 손', 'Quick hands', '早業', '快手'],
    'ach.fast_7.d': ['7×7 판을 5분 안에 풀기', 'Solve a 7×7 board in under 5 minutes', '7×7を5分以内に解く', '5 分钟内完成 7×7'],
    'ach.daily_first': ['오늘의 퍼즐', 'Daily puzzle', '今日のパズル', '每日谜题'],
    'ach.daily_first.d': ['오늘의 퍼즐 처음 풀기', 'Solve your first daily puzzle', 'はじめて今日のパズルを解く', '第一次完成每日谜题'],
    'ach.daily_7': ['일주일 연속', 'Week streak', '1週間連続', '连续一周'],
    'ach.daily_7.d': ['오늘의 퍼즐 7일 연속 풀기', 'Solve the daily puzzle 7 days in a row', '今日のパズルを7日連続で解く', '连续 7 天完成每日谜题'],
    'ach.daily_30': ['한 달 연속', 'Month streak', '1か月連続', '连续一个月'],
    'ach.daily_30.d': ['오늘의 퍼즐 30일 연속 풀기', 'Solve the daily puzzle 30 days in a row', '今日のパズルを30日連続で解く', '连续 30 天完成每日谜题'],
    'ach.journey_10': ['여정의 시작', 'Journey begins', '旅のはじまり', '旅程开始'],
    'ach.journey_10.d': ['여정 10단계 깨기', 'Clear Journey stage 10', '旅のステージ10をクリア', '通过旅程第 10 关'],
    'ach.journey_30': ['먼 길', 'Long road', '長い道', '漫漫长路'],
    'ach.journey_30.d': ['여정 30단계 깨기', 'Clear Journey stage 30', '旅のステージ30をクリア', '通过旅程第 30 关'],
    'ach.journey_60': ['보물 상자', 'Treasure', '宝箱', '宝箱'],
    'ach.journey_60.d': ['여정 60단계 깨기', 'Clear Journey stage 60', '旅のステージ60をクリア', '通过旅程第 60 关'],
    'ach.journey_100': ['정상', 'Summit', '頂上', '登顶'],
    'ach.journey_100.d': ['여정 100단계 깨기', 'Clear Journey stage 100', '旅のステージ100をクリア', '通过旅程第 100 关'],
    'ach.journey_perfect': ['별 가득', 'All stars', '星いっぱい', '满星'],
    'ach.journey_perfect.d': ['여정 한 장(10단계)을 모두 별 셋으로', 'Get 3 stars on every stage of a Journey chapter', '旅の1章(10ステージ)をすべて星3つに', '旅程一章（10 关）全部三星'],
    'ach.battle_first': ['첫 대결 승리', 'First battle win', '初対戦勝利', '首次对战胜利'],
    'ach.battle_first.d': ['1:1 대결에서 처음 이기기', 'Win your first 1:1 battle', '1対1対戦ではじめて勝つ', '第一次赢得 1 对 1 对战'],
    'ach.battle_30': ['대결의 고수', 'Battle master', '対戦の達人', '对战高手'],
    'ach.battle_30.d': ['1:1 대결에서 30번 이기기', 'Win 30 battles', '1対1対戦で30回勝つ', '赢得 30 场对战'],

    // ── 1:1 대결 (battle.js) ──
    'tab.battle': ['대결', 'Battle', '対戦', '对战'],
    'battle.title': ['1:1 대결', '1:1 Battle', '1対1対戦', '1 对 1 对战'],
    'battle.player': ['플레이어', 'Player', 'プレイヤー', '玩家'],
    'battle.locked': ['퍼즐을 {n}판 풀면 대결이 열려요', 'Solve {n} puzzles to unlock battles', 'パズルを{n}問解くと対戦が開きます', '完成 {n} 局谜题即可解锁对战'],
    'battle.lockedGo': ['퍼즐 풀러 가기', 'Go solve puzzles', 'パズルを解きに行く', '去解谜'],
    'battle.tier.n6': ['대결', 'Battle', '対戦', '对战'],
    'battle.tier.n8': ['마스터', 'Master', 'マスター', '大师'],
    'battle.tier.bronze': ['브론즈', 'Bronze', 'ブロンズ', '青铜'],
    'battle.tier.silver': ['실버', 'Silver', 'シルバー', '白银'],
    'battle.tier.gold': ['골드', 'Gold', 'ゴールド', '黄金'],
    'battle.tier.diamond': ['다이아', 'Diamond', 'ダイヤ', '钻石'],
    'battle.season.title': ['{m}월 시즌 · {t}', 'Month {m} season · {t}', '{m}月シーズン · {t}', '{m}月赛季 · {t}'],
    'battle.season.points': ['{p}점', '{p} pts', '{p}点', '{p} 分'],
    'battle.season.toNext': ['{t}까지 {n}점', '{n} pts to {t}', '{t}まで{n}点', '距{t}还差 {n} 分'],
    'battle.season.top': ['가장 높은 등급이에요', 'Top tier', '最高ランクです', '已是最高等级'],
    'battle.season.daysLeft': ['{n}일 남음', '{n} days left', '残り{n}日', '剩 {n} 天'],
    'battle.season.howTitle': ['시즌', 'Season', 'シーズン', '赛季'],
    'battle.season.how': [
      '한 달이 한 시즌이에요. 이기면 점수가 오르고 지면 조금 내려가요.<br>이기면 +10 · 지면 −4<br>브론즈 0 · 실버 100 · 골드 300 · 다이아 600<br>오른 등급 아래로는 내려가지 않고, 새 달은 지난달 등급 한 단계 아래에서 시작해요.',
      'Each month is a season. Wins raise your points, losses lower them a little.<br>Win +10 · Loss −4<br>Bronze 0 · Silver 100 · Gold 300 · Diamond 600<br>You never drop below a tier you reached, and each month starts one tier below last month’s.',
      '1か月が1シーズン。勝つと点数が上がり、負けると少し下がります。<br>勝ち +10 · 負け −4<br>ブロンズ 0 · シルバー 100 · ゴールド 300 · ダイヤ 600<br>上がったランクより下には落ちず、新しい月は先月の1つ下のランクから始まります。',
      '一个月为一个赛季。赢了加分，输了扣一点分。<br>赢 +10 · 输 −4<br>青铜 0 · 白银 100 · 黄金 300 · 钻石 600<br>不会掉到已达到的等级以下，新的月份从上月等级的下一级开始。',
    ],
    'battle.wins': ['승', 'Wins', '勝', '胜'],
    'battle.losses': ['패', 'Losses', '敗', '负'],
    'battle.winRate': ['승률', 'Win rate', '勝率', '胜率'],
    'battle.record': ['{w}승 {l}패', '{w}W {l}L', '{w}勝{l}敗', '{w}胜{l}负'],
    'battle.rate': ['승률 {r}%', '{r}% wins', '勝率{r}%', '胜率 {r}%'],
    'battle.me': ['나', 'You', 'わたし', '我'],
    'battle.anon': ['익명', 'Anonymous', '匿名', '匿名'],
    'battle.nickShown': ['상대에게 보이는 내 이름', 'Your name in battles', '対戦で見える名前', '对战中显示的名字'],
    'battle.nickNone': ['아직 닉네임이 없어요', 'No nickname yet', 'まだニックネームがありません', '还没有昵称'],
    'battle.nickMake': ['닉네임 정하기', 'Set nickname', 'ニックネームを決める', '设置昵称'],
    'battle.nickChange': ['바꾸기', 'Change', '変更', '修改'],
    'battle.nickSkip': ['나중에 할게요', 'Later', 'あとで', '以后再说'],
    'battle.nickSave': ['저장', 'Save', '保存', '保存'],
    'battle.nickTitle': ['대결 닉네임', 'Battle nickname', '対戦ニックネーム', '对战昵称'],
    'battle.nickBody': ['대결 상대에게 보이는 이름이에요.', 'This is the name your opponents see.', '対戦相手に表示される名前です。', '这是对手看到的名字。'],
    'battle.nickPh': ['2~10자', '2-10 characters', '2〜10文字', '2~10 个字'],
    'battle.nickLen': ['{a}~{b}자로 정해 주세요', 'Use {a}-{b} characters', '{a}〜{b}文字にしてください', '请输入 {a}~{b} 个字'],
    'battle.nickChars': ['글자와 숫자만 쓸 수 있어요', 'Letters and numbers only', '文字と数字だけ使えます', '只能使用文字和数字'],
    'battle.nickBad': ['다른 닉네임을 써 주세요', 'Please choose another nickname', '別のニックネームにしてください', '请换一个昵称'],
    'battle.nickSaved': ['닉네임을 「{n}」(으)로 정했어요', 'Nickname set to "{n}"', 'ニックネームを「{n}」にしました', '昵称已设为「{n}」'],
    'battle.start': ['대결 시작', 'Start battle', '対戦スタート', '开始对战'],
    'battle.tickets': ['티켓 {n}장', '{n} tickets', 'チケット{n}枚', '{n} 张票'],
    'battle.ticketsFull': ['가득 찼어요', 'Full', '満タン', '已满'],
    'battle.nextTicket': ['{m}분 뒤 한 장', '+1 in {m} min', '{m}分後に1枚', '{m} 分钟后 +1'],
    'battle.noTickets': ['티켓이 모자라요', 'Not enough tickets', 'チケットが足りません', '票不够'],
    'battle.ticketAd': ['광고 보고 티켓 {n}장 받기', 'Watch an ad for {n} tickets', '広告を見てチケット{n}枚', '看广告领 {n} 张票'],
    'battle.ticketGot': ['티켓 {n}장을 받았어요', 'Got {n} tickets', 'チケット{n}枚もらいました', '获得 {n} 张票'],
    'battle.ok': ['확인', 'OK', 'OK', '确定'],
    'battle.cancel': ['그만 찾기', 'Cancel', 'キャンセル', '取消'],
    'battle.how': [
      '상대는 같은 판을 먼저 푼 사람의 실제 기록이에요. 상대보다 먼저 다 풀면 이겨요. 대결에서는 힌트를 못 써요.',
      'Your opponent is a real player’s recording on the same board. Finish before them to win. No hints in battles.',
      '相手は同じ盤を先に解いた人の実際の記録です。相手より先に解けば勝ち。対戦ではヒントは使えません。',
      '对手是先完成同一盘面的真实玩家记录。比对手先完成就赢了。对战中不能使用提示。',
    ],
    'battle.searching': ['상대를 찾고 있어요…', 'Finding an opponent…', '相手を探しています…', '正在寻找对手…'],
    'battle.noMatch': ['지금은 상대를 못 찾았어요. 티켓은 그대로예요', 'No opponent right now. Your tickets are safe', 'いまは相手が見つかりません。チケットはそのままです', '暂时没有找到对手，票没有扣'],
    'battle.lv': ['Lv {n}', 'Lv {n}', 'Lv {n}', 'Lv {n}'],
    'battle.oppOut': ['상대가 하트를 다 썼어요. 끝까지 풀면 이겨요!', 'Your opponent is out of hearts. Finish to win!', '相手のハートがなくなりました。最後まで解けば勝ち！', '对手的爱心用完了，完成就能赢！'],
    'battle.won': ['승리!', 'Victory!', '勝利！', '胜利！'],
    'battle.lost': ['패배', 'Defeat', '敗北', '失败'],
    'battle.lostGhost': ['{n} 님이 먼저 다 풀었어요', '{n} finished first', '{n}さんが先に解きました', '{n} 先完成了'],
    'battle.lostMistakes': ['하트를 다 썼어요', 'Out of hearts', 'ハートがなくなりました', '爱心用完了'],
    'battle.season.up': ['{t} 등급으로 올랐어요!', 'Promoted to {t}!', '{t}に昇格しました！', '升到{t}了！'],
    'battle.season.gain': ['+{n}점 · 시즌 {p}점', '+{n} pts · season {p}', '+{n}点 · シーズン{p}点', '+{n} 分 · 赛季 {p} 分'],
    'battle.season.loss': ['−{n}점 · 시즌 {p}점', '−{n} pts · season {p}', '−{n}点 · シーズン{p}点', '−{n} 分 · 赛季 {p} 分'],
    'battle.season.keep': ['시즌 {p}점 (등급 유지)', 'Season {p} pts (tier kept)', 'シーズン{p}点(ランク維持)', '赛季 {p} 分（保级）'],
    'battle.again': ['한 번 더 대결', 'Battle again', 'もう一度対戦', '再来一局'],
    'battle.quitTitle': ['대결을 그만둘까요?', 'Leave the battle?', '対戦をやめますか？', '要退出对战吗？'],
    'battle.quitBody': ['지금 나가면 진 걸로 쳐요.', 'Leaving now counts as a loss.', 'いまやめると負けになります。', '现在退出算作失败。'],
    'battle.keep': ['계속하기', 'Keep playing', '続ける', '继续'],
    'battle.quit': ['그만두기', 'Leave', 'やめる', '退出'],

    'up.new': ['새 버전이 나왔어요', 'A new version is out', '新しいバージョンがあります', '有新版本'],
    'up.later': ['나중에', 'Later', 'あとで', '稍后'],
    'up.go': ['업데이트', 'Update', '更新', '更新'],
    'up.restart': ['다시 시작', 'Restart', '再起動', '重启'],
  };

  let lang = 'ko';

  function pick() {
    const want = (St && St.d.lang) || 'auto';
    if (want !== 'auto' && CODES.includes(want)) return want;
    const sys = (navigator.language || 'en').toLowerCase();
    if (sys.startsWith('ko')) return 'ko';
    if (sys.startsWith('ja')) return 'ja';
    if (sys.startsWith('zh')) return 'zh';
    return 'en';
  }

  /** 문구 하나. {n} 같은 자리는 vars 로 채운다. */
  function T(key, vars) {
    const row = S[key];
    let s = row ? (row[CODES.indexOf(lang)] || row[0]) : key;
    if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }

  /** 화면에 박힌 글을 지금 언어로 다시 쓴다 */
  function paint(root) {
    (root || document).querySelectorAll('[data-t]').forEach((el) => {
      const s = T(el.dataset.t);
      if (s.includes('<')) el.innerHTML = s; else el.textContent = s;
    });
    (root || document).querySelectorAll('[data-t-aria]').forEach((el) => el.setAttribute('aria-label', T(el.dataset.tAria)));
    (root || document).querySelectorAll('[data-t-ph]').forEach((el) => el.setAttribute('placeholder', T(el.dataset.tPh)));
    document.documentElement.lang = lang;
    document.title = T('app.name');
  }

  function setLang(code) {
    St.d.lang = code;
    St.save();
    lang = pick();
    paint();
    if (window.Home && window.Home.repaint) window.Home.repaint();
    document.dispatchEvent(new Event('langchange'));   // 글이 코드로 그려지는 곳(games.js 등)
  }

  /** 날짜·숫자는 그 나라 방식으로 */
  const locale = () => ({ ko: 'ko-KR', en: 'en-US', ja: 'ja-JP', zh: 'zh-CN' })[lang];
  const fmtDate = (y, m, d) => new Date(y, m - 1, d).toLocaleDateString(locale(), { month: 'long', day: 'numeric' });
  const fmtMonth = (y, m) => new Date(y, m - 1, 1).toLocaleDateString(locale(), { year: 'numeric', month: 'long' });

  lang = pick();
  window.T = T;
  window.I18n = { T, paint, setLang, lang: () => lang, codes: CODES, locale, fmtDate, fmtMonth };
  document.addEventListener('DOMContentLoaded', () => paint());
})();
