export type StoryCreationModeId =
  | 'discover'
  | 'co-create'
  | 'plan'
  | 'write'
  | 'reflect';

export type StoryCreationModeStatus = 'active' | 'available' | 'locked';

export type StoryCoCreationEntrypointId =
  | 'protagonist'
  | 'partner'
  | 'world'
  | 'stage'
  | 'power'
  | 'faction'
  | 'conflict'
  | 'scene'
  | 'ending'
  | 'branch';

export interface CoCreationModeDefinition {
  id: StoryCreationModeId;
  label: string;
  commandKind: 'next' | 'interview' | 'preview-plan' | 'context-pack' | 'creative-report';
  reason: string;
}

export interface CoCreationEntrypointDefinition {
  id: StoryCoCreationEntrypointId;
  label: string;
  mode: StoryCreationModeId;
  focusTopic: string;
  reason: string;
  whenToUse: string;
  guidingQuestion: string;
  candidateArtifact: string;
  canonBoundary: string;
  nextRecommendation: string;
  exampleAnswers: string[];
}

export const CO_CREATION_MODES: readonly CoCreationModeDefinition[] = [
  {
    id: 'discover',
    label: '探索模式',
    commandKind: 'next',
    reason: '先保存兴趣点、灵感碎片和可玩方向，不急着定稿。'
  },
  {
    id: 'co-create',
    label: '共创访谈',
    commandKind: 'interview',
    reason: '围绕一个入口追问，生成候选而不是直接写入正典。'
  },
  {
    id: 'plan',
    label: '结构规划',
    commandKind: 'preview-plan',
    reason: '在核心要素足够成熟后，把选择转成可确认的计划预览。'
  },
  {
    id: 'write',
    label: '正文写作',
    commandKind: 'context-pack',
    reason: '读取上下文包和任务边界，再进入章节正文。'
  },
  {
    id: 'reflect',
    label: '回顾修订',
    commandKind: 'creative-report',
    reason: '回看已经创造出的内容、未决项和偏离风险。'
  }
];

export const CO_CREATION_ENTRYPOINTS: readonly CoCreationEntrypointDefinition[] = [
  {
    id: 'protagonist',
    label: '主角入口',
    mode: 'co-create',
    focusTopic: 'protagonist',
    reason: '先把主角欲望、误判和成长代价做成候选，不急着定稿。',
    whenToUse: '你最先想到主角气质、价值观、能力盲区或成功路线。',
    guidingQuestion: '主角最想要什么，最容易误判什么，第一次成功和失败分别因为什么？',
    candidateArtifact: '候选主角核心卡、成长路线候选、character-state 待确认项',
    canonBoundary: '所有补全都是候选；只有用户确认后才能进入 specification、tracking 或正文正典。',
    nextRecommendation: '补完主角后，建议转向伙伴入口或冲突入口，看谁会挑战这条成长路线。',
    exampleAnswers: [
      '晏无想证明工程方法也能拯救魔法事故，但会低估制度和人情成本。',
      '第一次成功来自拆解旧法阵依赖，第一次失败来自把活人选择当成系统变量。'
    ]
  },
  {
    id: 'partner',
    label: '伙伴入口',
    mode: 'co-create',
    focusTopic: 'partner',
    reason: '探索谁能挑战主角、制造关系张力，并保持候选状态。',
    whenToUse: '你想先找一个能让主角变得更有趣、更不自洽的人。',
    guidingQuestion: '谁最能挑战主角，为什么不信他，能力如何互补，TA 自己想要什么？',
    candidateArtifact: '候选核心伙伴卡、关系张力卡、relationships 待确认项',
    canonBoundary: '伙伴动机、关系起点和情感推进都先作为候选，确认后才写入关系追踪。',
    nextRecommendation: '确认伙伴张力后，建议转向场景入口，试一幕两人必须合作的戏。',
    exampleAnswers: [
      '伙伴熟悉学院规训，能指出晏无把魔法世界当系统调试的傲慢。',
      'TA 需要主角解决事故，但不相信主角能理解事故背后的政治代价。'
    ]
  },
  {
    id: 'world',
    label: '世界入口',
    mode: 'co-create',
    focusTopic: 'world',
    reason: '把世界压力、资源结构和普通人的感受做成可比较候选。',
    whenToUse: '你想先搭一个真实可冒险的世界，而不是先定完整年表。',
    guidingQuestion: '第一舞台在哪里，谁掌握资源，普通人最早如何感到世界正在出问题？',
    candidateArtifact: '候选 WorldFact、第一舞台候选、世界压力卡',
    canonBoundary: '世界规则和历史解释先作为候选并保留来源；没有确认前不得当作 World Bible 正典。',
    nextRecommendation: '世界压力成形后，建议转向冲突入口，决定第一卷谁会因此行动。',
    exampleAnswers: [
      '边境学院垄断符文编译许可，民生法器开始间歇性失灵。',
      '港口工坊发现旧日志在无人触发时自我改写，贵族先把它压成事故。'
    ]
  },
  {
    id: 'stage',
    label: '舞台入口',
    mode: 'co-create',
    focusTopic: 'stage',
    reason: '把第一舞台、资源结构和普通人压力做成可比较候选。',
    whenToUse: '你已经有开局地点或第一眼异界差异，想先让它可写。',
    guidingQuestion: '故事第一眼在哪里发生，这个地方的秩序、禁令和代价是什么？',
    candidateArtifact: '候选第一舞台卡、日常秩序卡、场景压力提示',
    canonBoundary: '地点细节先作为候选；确认后才进入 World Bible 或 Scene Card。',
    nextRecommendation: '舞台清楚后，建议转向场景入口，写一幕能展示秩序裂缝的戏。',
    exampleAnswers: [
      '开局在学院维修库，所有低阶法器都需要贵族签发的维护许可。',
      '开局在冒险者公会，委托墙开始出现无人发布的古代任务。'
    ]
  },
  {
    id: 'power',
    label: '能力入口',
    mode: 'co-create',
    focusTopic: 'power',
    reason: '先确认能力爽点、限制和失败后果，再进入规格或计划。',
    whenToUse: '你想先玩金手指、能力边界、失败代价或第一次高光。',
    guidingQuestion: '能力爽点来自哪里，明确不能做什么，第一次使用会解决什么又留下什么后果？',
    candidateArtifact: '候选能力边界卡、世界规则候选、首个能力场景候选',
    canonBoundary: '能力规则、限制和例外都先作为候选，必须确认后才进入规格；示例爽点不能默认成正典。',
    nextRecommendation: '能力边界清楚后，建议转向场景入口测试它，或转向势力入口看谁会垄断它。',
    exampleAnswers: [
      '爽点来自把法术问题拆成可验证步骤，但不能凭空创造材料。',
      '失败后会污染局部法阵日志，让学院误以为主角触犯禁术。'
    ]
  },
  {
    id: 'faction',
    label: '势力入口',
    mode: 'co-create',
    focusTopic: 'faction',
    reason: '探索谁垄断知识、资源或合法性，以及主角第一碰撞点。',
    whenToUse: '你想先确认学院、贵族、工会、教会或商会之间的利益结构。',
    guidingQuestion: '谁垄断知识、资源或合法性，主角第一次会碰到哪条不可见规则？',
    candidateArtifact: '候选势力关系卡、利益冲突卡、第一碰撞点',
    canonBoundary: '势力立场和制度解释先作为候选；确认后才写入 World Bible 或冲突追踪。',
    nextRecommendation: '势力结构成形后，建议转向冲突入口，决定第一卷阶段胜利和代价。',
    exampleAnswers: [
      '学院垄断施法认证，贵族垄断材料，工坊只能在夹缝里修补民生法器。',
      '主角第一次碰撞是绕过许可救人，却让伙伴背上违纪风险。'
    ]
  },
  {
    id: 'conflict',
    label: '冲突入口',
    mode: 'co-create',
    focusTopic: 'conflict',
    reason: '比较第一卷阻力、阶段胜利、代价和更大危机入口。',
    whenToUse: '你想先知道第一卷到底打什么、赢什么、付出什么。',
    guidingQuestion: '第一卷阻力来自人、制度、误解、资源还是异常，主角赢得什么又付出什么？',
    candidateArtifact: '候选第一卷冲突卡、promise/tension 候选',
    canonBoundary: '阶段胜利、失败代价和长线威胁连接都先作为候选，确认后才进入计划。',
    nextRecommendation: '冲突清楚后，建议转向主角入口检查成长代价，或转向世界入口补压力来源。',
    exampleAnswers: [
      '第一卷阻力来自学院掩盖事故，主角赢得救援资格，却失去合法身份。',
      '冲突表面是贵族事故，实质露出第三次寂静正在改写底层规则。'
    ]
  },
  {
    id: 'scene',
    label: '场景入口',
    mode: 'co-create',
    focusTopic: 'scene',
    reason: '把脑中已有的一幕戏变成候选 Scene Card，而不是逼你先补全整本书。',
    whenToUse: '你脑中已经有一幕动作、对话、事故、相遇或高光。',
    guidingQuestion: '这一幕开头发生什么，谁在场，推进哪条线，关系如何变化，结尾钩子是什么？',
    candidateArtifact: '候选 Scene Card、章节任务候选',
    canonBoundary: 'Scene Card 先是候选；涉及角色关系、世界事实和能力规则的内容需要单独确认。',
    nextRecommendation: '场景试出来后，建议回到主角、伙伴或冲突入口，把这一幕背后的选择补清楚。',
    exampleAnswers: [
      '候选 Scene Card：维修库突然全线报警，晏无用日志定位事故，伙伴阻止他越权。',
      '候选 Scene Card：公会任务墙出现已完成的未来委托，主角先当成系统缓存错误。'
    ]
  },
  {
    id: 'ending',
    label: '结尾/反转入口',
    mode: 'discover',
    focusTopic: 'ending',
    reason: '把远期震撼点拆成伏笔和第一卷只能露出的一角。',
    whenToUse: '你先想到结局、反转、真相或某个远期情绪回报。',
    guidingQuestion: '这个反转改变哪个主题，需要隐藏哪些信息，第一卷只能让读者看见哪一角？',
    candidateArtifact: '远期候选、伏笔候选、branch/what-if',
    canonBoundary: '远期真相默认是候选和伏笔草稿，不能提前强压当前故事走向。',
    nextRecommendation: '反转有雏形后，建议转向分支入口比较代价，或转向世界入口安排早期异常。',
    exampleAnswers: [
      '第三次寂静不是外敌，而是文明为了自救反复重启知识系统留下的副作用。',
      '第一卷只露出旧日志会梦游，不能直接解释远古神族和高等精灵的全貌。'
    ]
  },
  {
    id: 'branch',
    label: '分支/what-if 入口',
    mode: 'discover',
    focusTopic: 'branch',
    reason: '比较几条可能走向的风味、牺牲和后续影响。',
    whenToUse: '你在几个走向之间摇摆，想先看它们会长成什么小说。',
    guidingQuestion: '这条分支会强化什么风味，牺牲什么，对关系、世界和节奏有什么影响？',
    candidateArtifact: '分支对照卡、branch impact',
    canonBoundary: 'what-if 只是候选试验分支；没有 promote 前不得覆盖主线正典。',
    nextRecommendation: '分支比较后，建议保留最有生命力的一条进入冲突或场景入口继续打磨。',
    exampleAnswers: [
      '分支 A 强化学院冒险，牺牲广阔世界感；分支 B 强化边境调查，牺牲校园关系密度。',
      '如果伙伴一开始代表学院，会提升慢热张力，但需要更早解释制度并非纯恶。'
    ]
  }
];

const ENTRYPOINT_IDS = new Set(CO_CREATION_ENTRYPOINTS.map(entry => entry.id));

export const normalizeCoCreationEntrypointId = (
  value: unknown
): StoryCoCreationEntrypointId | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  return ENTRYPOINT_IDS.has(normalized as StoryCoCreationEntrypointId)
    ? normalized as StoryCoCreationEntrypointId
    : undefined;
};

export const getCoCreationEntrypointDefinition = (
  id: StoryCoCreationEntrypointId
): CoCreationEntrypointDefinition =>
  CO_CREATION_ENTRYPOINTS.find(entry => entry.id === id)!;
