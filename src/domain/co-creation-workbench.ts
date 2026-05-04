import type { InterestingChoice } from './clarification.js';
import type { StoryCoreElementId } from './story-core-elements.js';

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

export type TodayCreationModeId =
  | 'play-character'
  | 'write-scene'
  | 'organize-setting'
  | 'compare-branches'
  | 'free-chat';

export interface CoCreationModeDefinition {
  id: StoryCreationModeId;
  label: string;
  commandKind: 'next' | 'interview' | 'preview-plan' | 'context-pack' | 'creative-report';
  reason: string;
}

export interface CoCreationEntryMaturityImpact {
  coreElement: StoryCoreElementId;
  priority: number;
  reason: string;
}

export interface CoCreationEntrypointDefinition {
  id: StoryCoCreationEntrypointId;
  label: string;
  title: string;
  mode: StoryCreationModeId;
  focusTopic: string;
  reason: string;
  whenToUse: string;
  openingQuestions: string[];
  guidingQuestion: string;
  interestingChoices: InterestingChoice[];
  candidateArtifacts: string[];
  candidateArtifact: string;
  canonBoundary: string;
  nextRecommendations: string[];
  nextRecommendation: string;
  maturityImpact: CoCreationEntryMaturityImpact[];
  exampleAnswers: string[];
}

export interface TodayCreationModeDefinition {
  id: TodayCreationModeId;
  label: string;
  entrypointIds: StoryCoCreationEntrypointId[];
  maxQuestions: number;
  candidateLimit: number;
  writesFiles: boolean;
  outputContract: string;
  canonBoundary: string;
  toneGuide: string;
  reason: string;
  responseOptions: string[];
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

const TODAY_RESPONSE_OPTIONS = ['确认', '改写', '拒绝', '稍后'];

export const TODAY_CREATION_MODES: readonly TodayCreationModeDefinition[] = [
  {
    id: 'play-character',
    label: '我想玩角色',
    entrypointIds: ['protagonist', 'partner'],
    maxQuestions: 2,
    candidateLimit: 2,
    writesFiles: false,
    outputContract: '只给 2 个角色/关系候选和一句创作回声，不写入文件。',
    canonBoundary: '所有角色与关系内容保持候选状态，作者确认前不进入正典。',
    toneGuide: '短、有画面、有关系张力。',
    reason: '先让人物变得会行动、会误判、会彼此牵动。证据来自 Inquirer.js 的最小问题集思路。',
    responseOptions: TODAY_RESPONSE_OPTIONS
  },
  {
    id: 'write-scene',
    label: '我想写一幕',
    entrypointIds: ['scene', 'stage', 'power'],
    maxQuestions: 2,
    candidateLimit: 2,
    writesFiles: false,
    outputContract: '只给 2 个可写场景候选，不写入文件，不生成章节正文。',
    canonBoundary: 'Scene Card 只是候选，涉及人物、世界和能力的事实需单独确认。',
    toneGuide: '短、具体、有开头动作和结尾钩子。',
    reason: '像 Twine 从任意节点进入，先试一幕能不能写动。',
    responseOptions: TODAY_RESPONSE_OPTIONS
  },
  {
    id: 'organize-setting',
    label: '我想整理设定',
    entrypointIds: ['world', 'stage', 'faction', 'power'],
    maxQuestions: 2,
    candidateLimit: 2,
    writesFiles: false,
    outputContract: '只整理 2 个设定候选和确认边界，不写入文件，不写入 World Bible。',
    canonBoundary: '世界规则、势力和能力边界都是候选，确认前不能当作正典。',
    toneGuide: '短、可比较、先讲故事里的具体压力。',
    reason: '借鉴 Cucumber.js 的场景化验收，把设定落到行为和后果。',
    responseOptions: TODAY_RESPONSE_OPTIONS
  },
  {
    id: 'compare-branches',
    label: '我想比较分支',
    entrypointIds: ['branch', 'conflict', 'ending'],
    maxQuestions: 2,
    candidateLimit: 2,
    writesFiles: false,
    outputContract: '只比较 2 条 what-if 风味、代价和下一幕测试，不写入文件，不 promote 分支。',
    canonBoundary: '分支候选只是探索路径，没有 promote 前不得覆盖主线正典。',
    toneGuide: '短、讲取舍、每条分支都给一个牺牲。',
    reason: '借鉴 Twine 的路径探索，但保留为文本候选。',
    responseOptions: TODAY_RESPONSE_OPTIONS
  },
  {
    id: 'free-chat',
    label: '我只想随便聊聊',
    entrypointIds: ['power', 'stage', 'protagonist'],
    maxQuestions: 2,
    candidateLimit: 2,
    writesFiles: false,
    outputContract: '只陪作者发散 2 个可能方向，不写入文件，不生成大纲。',
    canonBoundary: '闲聊内容默认都是候选灵感，作者确认前不进入任何正典文件。',
    toneGuide: '短、轻松、有画面，不像项目管理报告。',
    reason: '保留低门槛入口，让作者不需要先理解全部命令。',
    responseOptions: TODAY_RESPONSE_OPTIONS
  }
];

type CoCreationEntrypointInput = Omit<
CoCreationEntrypointDefinition,
'title' | 'guidingQuestion' | 'candidateArtifact' | 'nextRecommendation'
> & {
  title?: string;
};

const defineEntrypoint = (
  entry: CoCreationEntrypointInput
): CoCreationEntrypointDefinition => ({
  ...entry,
  title: entry.title ?? entry.label,
  guidingQuestion: entry.openingQuestions[0] ?? '',
  candidateArtifact: entry.candidateArtifacts.join('、'),
  nextRecommendation: entry.nextRecommendations[0] ?? ''
});

export const CO_CREATION_ENTRYPOINTS: readonly CoCreationEntrypointDefinition[] = [
  defineEntrypoint({
    id: 'protagonist',
    label: '主角入口',
    mode: 'co-create',
    focusTopic: 'protagonist',
    reason: '先把主角欲望、误判和成长代价做成候选，不急着定稿。',
    whenToUse: '你最先想到主角气质、价值观、能力盲区或成功路线。',
    openingQuestions: [
      '主角最想要什么，最容易误判什么？',
      '他第一次成功靠的是什么，第一次失败又暴露什么盲区？',
      '这条成功路线会让他失去什么，或者必须学会什么？'
    ],
    interestingChoices: [
      {
        appeal: '先抓住主角价值观和工程脑爽点，作者能立刻感到“这个人会怎么行动”。',
        cost: '如果只强化聪明，会削弱人物的痛感和成长代价。',
        relationshipImpact: '伙伴更容易从“被救的人”变成能挑战主角方法论的人。',
        worldImpact: '主角的行动会暴露世界制度、知识垄断和普通人压力。',
        futureHook: '下一轮可以追问第一次失败后，谁因此付出代价。',
        confirmationBoundary: '这些都是候选主角弧线，确认前不写入正典。'
      },
      {
        appeal: '先定义误判，后续冒险会自然长出冲突和幽默。',
        cost: '误判太重会压低轻松冒险感，需要保留可修复空间。',
        relationshipImpact: '慢热关系可以从“指出误判”开始，而不是突然互相欣赏。',
        worldImpact: '误判会让本地魔法社会显得真实，而不是只服务金手指。',
        futureHook: '下一轮可以比较他是先改规则，还是先学会与人协作。',
        confirmationBoundary: '误判和成长代价先作为候选，不默认决定整本书主题。'
      }
    ],
    candidateArtifacts: ['候选主角核心卡', '成长路线候选', 'character-state 待确认项'],
    canonBoundary: '所有补全都是候选；只有用户确认后才能进入 specification、tracking 或正文正典。',
    nextRecommendations: [
      '补完主角后，建议转向伙伴入口或冲突入口，看谁会挑战这条成长路线。',
      '如果主角已经有明确能力，可以转向能力入口验证爽点和限制。'
    ],
    maturityImpact: [
      { coreElement: 'protagonist', priority: 1, reason: '直接补齐身份、欲望、价值观、误判和成长代价。' },
      { coreElement: 'growthRoute', priority: 2, reason: '把主角如何阶段性成功和付出代价变成可追踪路线。' }
    ],
    exampleAnswers: [
      '主角想证明自己的旧经验仍然有用，但会低估本地规则和人情成本。',
      '第一次成功来自拆解现场问题，第一次失败来自把活人选择当成可控变量。'
    ]
  }),
  defineEntrypoint({
    id: 'partner',
    label: '伙伴入口',
    mode: 'co-create',
    focusTopic: 'partner',
    reason: '探索谁能挑战主角、制造关系张力，并保持候选状态。',
    whenToUse: '你想先找一个能让主角变得更有趣、更不自洽的人。',
    openingQuestions: [
      '谁最能挑战主角，为什么一开始不信他？',
      'TA 自己想要什么，和主角的目标在哪里冲突？',
      '第一次信任变化发生在什么事件之后，代价由谁承担？'
    ],
    interestingChoices: [
      {
        appeal: '伙伴不只是功能位，会让每次胜利多一层关系判断。',
        cost: '伙伴欲望越独立，主角推进路线就越不能一路顺风。',
        relationshipImpact: '慢热感情有了互相试探、冲突和修复的具体抓手。',
        worldImpact: '伙伴立场能带出管理机构、地方权力或工会的内部合理性。',
        futureHook: '下一轮可以追问第一次合作后，谁更不愿承认自己被改变。',
        confirmationBoundary: '关系起点和情感推进都是候选，确认前不写入关系追踪。'
      },
      {
        appeal: '让伙伴掌握主角没有的本地知识，异界冒险会更有摩擦。',
        cost: '过强的伙伴可能分散主角高光，需要明确互补边界。',
        relationshipImpact: '双方互补会制造“必须合作但不能完全信任”的张力。',
        worldImpact: '本地知识让世界规则通过行动显现，而非百科说明。',
        futureHook: '下一轮可以选择伙伴第一次隐瞒什么，以及为什么。',
        confirmationBoundary: '伙伴能力、立场和秘密先作为候选，不默认成为正典。'
      }
    ],
    candidateArtifacts: ['候选核心伙伴卡', '关系张力卡', 'relationships 待确认项'],
    canonBoundary: '伙伴动机、关系起点和情感推进都先作为候选，确认后才写入关系追踪。',
    nextRecommendations: [
      '确认伙伴张力后，建议转向场景入口，试一幕两人必须合作的戏。',
      '如果伙伴代表某个组织，建议转向势力入口补清 TA 的立场来源。'
    ],
    maturityImpact: [
      { coreElement: 'partner', priority: 1, reason: '补齐伙伴独立欲望、关系张力和能挑战主角的理由。' },
      { coreElement: 'voice', priority: 3, reason: '通过互动暴露主角叙述声音、幽默和价值判断。' }
    ],
    exampleAnswers: [
      '伙伴熟悉本地规训，能指出主角用旧经验解释一切的傲慢。',
      'TA 需要主角解决事故，但不相信主角能理解事故背后的社会代价。'
    ]
  }),
  defineEntrypoint({
    id: 'world',
    label: '世界入口',
    mode: 'co-create',
    focusTopic: 'world',
    reason: '把世界压力、资源结构和普通人的感受做成可比较候选。',
    whenToUse: '你想先搭一个真实可冒险的世界，而不是先定完整年表。',
    openingQuestions: [
      '普通人最早如何感到世界正在出问题？',
      '谁掌握资源、知识或合法性，谁只能承受后果？',
      '第一卷只让读者看见哪一个局部压力？'
    ],
    interestingChoices: [
      {
        appeal: '先做世界压力，冒险会更像发生在真实社会里。',
        cost: '世界解释太多会挤压开局行动，需要控制揭示节奏。',
        relationshipImpact: '角色立场会因为资源和身份差异自然分叉。',
        worldImpact: '世界异常能成为文明级威胁的早期证据。',
        futureHook: '下一轮可以选择异常最先伤害谁，以及谁选择掩盖。',
        confirmationBoundary: '世界规则和历史解释先作为候选，确认前不进入 World Bible。'
      }
    ],
    candidateArtifacts: ['候选 WorldFact', '第一舞台候选', '世界压力卡'],
    canonBoundary: '世界规则和历史解释先作为候选并保留来源；没有确认前不得当作 World Bible 正典。',
    nextRecommendations: [
      '世界压力成形后，建议转向冲突入口，决定第一卷谁会因此行动。'
    ],
    maturityImpact: [
      { coreElement: 'stage', priority: 2, reason: '帮助第一舞台拥有社会压力和可写行动边界。' },
      { coreElement: 'longThreat', priority: 3, reason: '把长线威胁拆成早期小异常。' }
    ],
    exampleAnswers: [
      '地方机构垄断关键许可，民生设施开始间歇性失灵。',
      '港口仓库发现旧记录在无人触发时自我改写，管理者先把它压成事故。'
    ]
  }),
  defineEntrypoint({
    id: 'stage',
    label: '舞台入口',
    mode: 'co-create',
    focusTopic: 'stage',
    reason: '把第一舞台、资源结构和普通人压力做成可比较候选。',
    whenToUse: '你已经有开局地点或第一眼异界差异，想先让它可写。',
    openingQuestions: [
      '故事第一眼在哪里发生，这个地方的秩序和禁令是什么？',
      '普通人在这里最常遇到什么压力或代价？',
      '主角第一步会怎样撞上这里的规则？'
    ],
    interestingChoices: [
      {
        appeal: '先确定第一舞台，作者能立刻想象开局画面和可写事件。',
        cost: '舞台太封闭会限制冒险广度，需要保留外部压力入口。',
        relationshipImpact: '伙伴或反对者可以由舞台秩序自然长出来。',
        worldImpact: '第一舞台成为世界规则的第一眼，而不是孤立地点。',
        futureHook: '下一轮可以追问第一条被主角撞破的禁令。',
        confirmationBoundary: '地点细节先作为候选，确认后才进入 World Bible 或 Scene Card。'
      },
      {
        appeal: '把资源结构放进舞台，会让轻松冒险也有真实摩擦。',
        cost: '制度压力太重会压住轻松感，需要设计局部回报。',
        relationshipImpact: '角色会因为身份、许可和责任产生合作或对抗。',
        worldImpact: '舞台能展示知识垄断如何落到日常生活。',
        futureHook: '下一轮可以选择第一场事故发生在维修库、公会还是港口。',
        confirmationBoundary: '资源结构和禁令都是候选，不默认成为全世界通用规则。'
      }
    ],
    candidateArtifacts: ['候选第一舞台卡', '日常秩序卡', '场景压力提示'],
    canonBoundary: '地点细节先作为候选；确认后才进入 World Bible 或 Scene Card。',
    nextRecommendations: [
      '舞台清楚后，建议转向场景入口，写一幕能展示秩序裂缝的戏。',
      '如果舞台背后有组织垄断，建议转向势力入口。'
    ],
    maturityImpact: [
      { coreElement: 'stage', priority: 1, reason: '补齐第一舞台、资源结构、普通人压力和开局行动边界。' },
      { coreElement: 'factionConflict', priority: 3, reason: '舞台禁令可引出第一卷势力碰撞。' }
    ],
    exampleAnswers: [
      '开局在一个固定据点，所有关键服务都需要管理者签发的维护许可。',
      '开局在任务大厅，委托墙开始出现无人发布的旧任务。'
    ]
  }),
  defineEntrypoint({
    id: 'power',
    label: '能力入口',
    mode: 'co-create',
    focusTopic: 'power',
    reason: '先把能力爽点、限制和失败后果做成候选，再进入规格或计划。',
    whenToUse: '你想先玩金手指、能力边界、失败代价或第一次高光。',
    openingQuestions: [
      '能力爽点来自哪里，最明确不能做什么？',
      '第一次使用会解决什么，又留下什么后果？',
      '本地魔法体系会如何误读或压制这种能力？'
    ],
    interestingChoices: [
      {
        appeal: '先玩能力入口，核心能力的辨识度会最快出现。',
        cost: '能力太万能会削弱冒险和关系张力，需要明确失败代价。',
        relationshipImpact: '伙伴可以质疑主角把人和制度当成系统变量。',
        worldImpact: '本地魔法体系的误读会暴露知识垄断和规则边界。',
        futureHook: '下一轮可以追问第一次失败污染了什么记录或关系。',
        confirmationBoundary: '能力爽点、限制和例外都是候选，确认后才进入规格。'
      },
      {
        appeal: '把能力当工具而不是答案，轻松冒险和文明危机会更好共存。',
        cost: '轻量隐喻会牺牲部分硬核技术细节，需要靠场景代价补强。',
        relationshipImpact: '关系线能通过“你解决了问题但伤到了谁”推进。',
        worldImpact: '能力边界能解释为什么主角无法直接修好整个文明。',
        futureHook: '下一轮可以比较轻量隐喻、中度规则和硬规则三条分叉。',
        confirmationBoundary: '能力表达方式先作为候选，不替作者自动锁死风格。'
      }
    ],
    candidateArtifacts: ['候选能力边界卡', '世界规则候选', '首个能力场景候选'],
    canonBoundary: '能力规则、限制和例外都先作为候选，必须确认后才进入规格；示例爽点不能默认成正典。',
    nextRecommendations: [
      '能力边界清楚后，建议转向场景入口测试它，或转向势力入口看谁会垄断它。',
      '如果能力已经清楚，建议转向舞台入口放进真实压力里。'
    ],
    maturityImpact: [
      { coreElement: 'power', priority: 1, reason: '补齐能力用途、限制、代价和本地魔法规则关系。' },
      { coreElement: 'genrePromise', priority: 3, reason: '帮助确认爽点是硬规则、轻量隐喻还是折中表达。' }
    ],
    exampleAnswers: [
      '爽点来自把法术问题拆成可验证步骤，但不能凭空创造材料。',
      '失败后会污染局部记录，让管理者误以为主角触犯禁令。'
    ]
  }),
  defineEntrypoint({
    id: 'faction',
    label: '势力入口',
    mode: 'co-create',
    focusTopic: 'faction',
    reason: '探索谁垄断知识、资源或合法性，以及主角第一碰撞点。',
    whenToUse: '你想先确认管理机构、地方权力、工会、守护组织或商会之间的利益结构。',
    openingQuestions: [
      '谁垄断知识、资源或合法性，谁从现有秩序获利？',
      '主角第一次会碰到哪条不可见规则？',
      '哪个势力并非纯恶，却会成为第一卷阻力？'
    ],
    interestingChoices: [
      {
        appeal: '势力入口能让世界从背景变成会行动的结构。',
        cost: '势力逻辑太复杂会降低轻快感，需要先做第一碰撞点。',
        relationshipImpact: '伙伴的立场和风险可以绑定到具体组织。',
        worldImpact: '知识、资源和合法性的分配会支撑文明级威胁的可信度。',
        futureHook: '下一轮可以追问主角越权救人后，谁获利谁背锅。',
        confirmationBoundary: '势力立场和制度解释先作为候选，确认前不写入 World Bible。'
      },
      {
        appeal: '让反对者有合理利益，冲突会更耐看。',
        cost: '合理反派会削弱爽快打脸，需要设计阶段性回报。',
        relationshipImpact: '角色可能被夹在私人信任和组织责任之间。',
        worldImpact: '制度冲突能解释为什么个体善意无法立刻修好世界。',
        futureHook: '下一轮可以选择哪个组织最先压制主角。',
        confirmationBoundary: '第一碰撞点只是候选，不自动决定整卷反派。'
      }
    ],
    candidateArtifacts: ['候选势力关系卡', '利益冲突卡', '第一碰撞点'],
    canonBoundary: '势力立场和制度解释先作为候选；确认后才写入 World Bible 或冲突追踪。',
    nextRecommendations: [
      '势力结构成形后，建议转向冲突入口，决定第一卷阶段胜利和代价。',
      '如果势力已经清楚，建议转向伙伴入口确认谁会被组织立场牵动。'
    ],
    maturityImpact: [
      { coreElement: 'factionConflict', priority: 1, reason: '补齐谁垄断知识、资源、合法性和第一碰撞点。' },
      { coreElement: 'stage', priority: 3, reason: '让第一舞台拥有制度压力，而不是空泛地点。' }
    ],
    exampleAnswers: [
      '管理机构垄断专业认证，地方权力垄断材料，维修者只能在夹缝里维持民生设施。',
      '主角第一次碰撞是绕过许可救人，却让伙伴背上违纪风险。'
    ]
  }),
  defineEntrypoint({
    id: 'conflict',
    label: '冲突入口',
    mode: 'co-create',
    focusTopic: 'conflict',
    reason: '比较第一卷阻力、阶段胜利、代价和更大危机入口。',
    whenToUse: '你想先知道第一卷到底打什么、赢什么、付出什么。',
    openingQuestions: [
      '第一卷阻力来自人、制度、误解、资源还是异常？',
      '主角阶段性赢得什么，又必须付出什么？',
      '文明级威胁在第一卷只露出哪一个小异常？'
    ],
    interestingChoices: [
      {
        appeal: '先做冲突入口，故事会立刻有行动方向和阶段回报。',
        cost: '冲突过早锁死会减少探索乐趣，需要保留分支空间。',
        relationshipImpact: '胜利代价会迫使伙伴重新判断主角。',
        worldImpact: '局部冲突能把文明级威胁藏在可解决事件后面。',
        futureHook: '下一轮可以追问主角赢了之后失去什么合法身份或信任。',
        confirmationBoundary: '阶段胜利、失败代价和长线威胁连接都先作为候选。'
      },
      {
        appeal: '把异常做小，文明危机会慢慢逼近而不是开场压顶。',
        cost: '异常太轻会显得威胁不足，需要设计可见后果。',
        relationshipImpact: '角色会围绕“这是事故还是征兆”产生立场分歧。',
        worldImpact: '长线危机可以从民生设施、旧记录或任务墙的异常浮现。',
        futureHook: '下一轮可以选择谁最先把异常压成普通事故。',
        confirmationBoundary: '长线威胁解释先作为候选，不提前定稿；只确认第一卷能看见的一角。'
      }
    ],
    candidateArtifacts: ['候选第一卷冲突卡', 'promise/tension 候选', '长线威胁小异常候选'],
    canonBoundary: '阶段胜利、失败代价和长线威胁连接都先作为候选，确认后才进入计划。',
    nextRecommendations: [
      '冲突清楚后，建议转向主角入口检查成长代价，或转向世界入口补压力来源。',
      '如果冲突来自组织，建议转向势力入口补清阻力逻辑。'
    ],
    maturityImpact: [
      { coreElement: 'factionConflict', priority: 2, reason: '把第一卷阻力、阶段胜利和代价落成可计划冲突。' },
      { coreElement: 'longThreat', priority: 1, reason: '把文明级威胁拆成第一卷能承受的小异常。' }
    ],
    exampleAnswers: [
      '第一卷阻力来自管理者掩盖事故，主角赢得救援资格，却失去合法身份。',
      '冲突表面是地方事故，实质露出长线危机正在改写底层规则。'
    ]
  }),
  defineEntrypoint({
    id: 'scene',
    label: '场景入口',
    mode: 'co-create',
    focusTopic: 'scene',
    reason: '把脑中已有的一幕戏变成候选 Scene Card，而不是逼你先补全整本书。',
    whenToUse: '你脑中已经有一幕动作、对话、事故、相遇或高光。',
    openingQuestions: [
      '这一幕开头发生什么，谁在场？',
      '它推进哪条线，关系如何变化？',
      '结尾钩子是什么，下一幕为什么必须继续？'
    ],
    interestingChoices: [
      {
        appeal: '从一幕戏开始，作者能先体验“这本书能不能写动”。',
        cost: '单场景可能绕开核心设定，需要回流到入口卡补边界。',
        relationshipImpact: '场景能直接测试两人的合作、误会或信任变化。',
        worldImpact: '场景细节会暴露舞台规则和能力代价。',
        futureHook: '下一轮可以把这一幕背后的主角、伙伴或冲突补清楚。',
        confirmationBoundary: 'Scene Card 先是候选，涉及正典事实需单独确认。'
      }
    ],
    candidateArtifacts: ['候选 Scene Card', '章节任务候选'],
    canonBoundary: 'Scene Card 先是候选；涉及角色关系、世界事实和能力规则的内容需要单独确认。',
    nextRecommendations: [
      '场景试出来后，建议回到主角、伙伴或冲突入口，把这一幕背后的选择补清楚。'
    ],
    maturityImpact: [
      { coreElement: 'stage', priority: 4, reason: '用具体场景测试舞台规则是否可写。' },
      { coreElement: 'partner', priority: 4, reason: '用互动验证关系张力。' }
    ],
    exampleAnswers: [
      '候选 Scene Card：据点突然全线报警，主角用旧记录定位事故，伙伴阻止他越权。',
      '候选 Scene Card：公会任务墙出现已完成的未来委托，主角先当成系统缓存错误。'
    ]
  }),
  defineEntrypoint({
    id: 'ending',
    label: '结尾/反转入口',
    mode: 'discover',
    focusTopic: 'ending',
    reason: '把远期震撼点拆成伏笔和第一卷只能露出的一角。',
    whenToUse: '你先想到结局、反转、真相或某个远期情绪回报。',
    openingQuestions: [
      '这个反转改变哪个主题或人物理解？',
      '它需要隐藏哪些信息？',
      '第一卷只能让读者看见哪一角？'
    ],
    interestingChoices: [
      {
        appeal: '先有远期回报，早期伏笔会更有方向。',
        cost: '过早锁定结局会限制中途发现，需要只保留候选。',
        relationshipImpact: '远期真相可以反向定义关系里的秘密和代价。',
        worldImpact: '反转能解释长线威胁和旧文明遗留问题。',
        futureHook: '下一轮可以拆成第一卷只能出现的一个假线索。',
        confirmationBoundary: '远期真相默认是候选和伏笔草稿，不能强压当前故事走向。'
      }
    ],
    candidateArtifacts: ['远期候选', '伏笔候选', 'branch/what-if'],
    canonBoundary: '远期真相默认是候选和伏笔草稿，不能提前强压当前故事走向。',
    nextRecommendations: [
      '反转有雏形后，建议转向分支入口比较代价，或转向世界入口安排早期异常。'
    ],
    maturityImpact: [
      { coreElement: 'longThreat', priority: 3, reason: '帮助长线威胁拥有远期回报和早期伏笔。' },
      { coreElement: 'genrePromise', priority: 5, reason: '确认读者最终获得的是震撼、治愈还是价值反转。' }
    ],
    exampleAnswers: [
      '长线危机不是外敌，而是过去为了自救反复重启秩序留下的副作用。',
      '第一卷只露出旧记录会梦游，不能直接解释远古遗留问题的全貌。'
    ]
  }),
  defineEntrypoint({
    id: 'branch',
    label: '分支/what-if 入口',
    mode: 'discover',
    focusTopic: 'branch',
    reason: '比较几条可能走向的风味、牺牲和后续影响。',
    whenToUse: '你在几个走向之间摇摆，想先看它们会长成什么小说。',
    openingQuestions: [
      '这条分支会强化什么风味？',
      '它会牺牲什么，对关系、世界和节奏有什么影响？',
      '如果保留它，下一步最该测试哪一幕？'
    ],
    interestingChoices: [
      {
        appeal: '分支入口能保留探索乐趣，不急着选唯一答案。',
        cost: '分支太多会分散注意力，需要明确比较维度。',
        relationshipImpact: '不同分支会改变关系起点、信任速度和冲突强度。',
        worldImpact: '不同分支会改变世界压力的揭示顺序。',
        futureHook: '下一轮可以 promote 最有生命力的一条，或继续对照两条。',
        confirmationBoundary: 'what-if 只是候选试验分支，没有 promote 前不得覆盖主线正典。'
      }
    ],
    candidateArtifacts: ['分支对照卡', 'branch impact'],
    canonBoundary: 'what-if 只是候选试验分支；没有 promote 前不得覆盖主线正典。',
    nextRecommendations: [
      '分支比较后，建议保留最有生命力的一条进入冲突或场景入口继续打磨。'
    ],
    maturityImpact: [
      { coreElement: 'genrePromise', priority: 4, reason: '比较不同路线会强化或牺牲哪些阅读承诺。' },
      { coreElement: 'growthRoute', priority: 4, reason: '比较不同成功路线的收益和代价。' }
    ],
    exampleAnswers: [
      '分支 A 强化据点日常，牺牲广阔世界感；分支 B 强化旅途调查，牺牲固定关系密度。',
      '如果伙伴一开始代表现有秩序，会提升慢热张力，但需要更早解释制度并非纯恶。'
    ]
  })
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
