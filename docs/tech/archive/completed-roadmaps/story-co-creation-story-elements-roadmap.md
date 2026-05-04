# 故事共创访谈故事要素路线图

## 状态

Completed。F7-F11 已完成；下一步转入 F12 多入口共创与创作模式切换。本文承接总路线 F7-F11，聚焦人物情感、世界压力、Scene Card、参考作品节奏和作者画像。

## 共通上下文

本子路线继承 [story-co-creation-interview-roadmap.md](story-co-creation-interview-roadmap.md) 的产品目标：把 StorySpec 的早期流程从“收集字段并生成文件”升级为“故事共创访谈”。

执行本子路线时必须遵守：

- 作者是在创造小说世界，不是在填写系统字段。
- 高影响候选进入正典前必须保留候选状态、来源、确认边界和 preview/confirm/apply 或等价确认流程。
- 主角、伙伴、舞台、能力、势力、冲突是第一优先级核心入口。
- 高影响候选应展示吸引力、代价、关系影响、世界影响和后续钩子。
- README 只写已实现并验证的能力；本路线内容在完成前只作为待办。
- 开发某个 batch 前，优先读取本文对应 batch；跨主题时再读取关联子路线。


## 执行顺序

- F7：见本文 Batch F7。
- F8：见本文 Batch F8。
- F9：见本文 Batch F9。
- F10：见本文 Batch F10。
- F11：见本文 Batch F11。

## Batch F7：人物情感与关系追踪增强

类型：领域模型、追踪、访谈、任务生成

状态：Completed。已实现核心伙伴功能位风险识别、慢热关系追问、`relationshipArcs` 追踪模板和校验、任务/写作模板的关系变化 evidencePath 契约。

目标：把 StorySpec 的人物系统从“角色资料管理”推进到“人物欲望、情感关系和关系变化追踪”。长篇是否立得住，很大程度取决于主角和核心伙伴能否持续相互影响。

已有基础：

- `spec/tracking/relationships.json` 和 `character-state.json` 已存在。
- `templates/knowledge/character-profiles.md`、`templates/knowledge/character-voices.md` 已有角色资料入口。
- AGENTS 画像中已有 `slow-burn`、`romance`、`multi-thread` 边界。

缺口：

- 早期访谈对主角欲望、恐惧、误判和成长代价追问不足。
- 核心伙伴容易被写成功能位，例如引路人、恋爱对象、竞争者，而不是能挑战主角的人。
- 慢热关系缺少可追踪的信任、距离、冲突、脆弱、修复节点。

建议方案：

1. 在核心要素成熟度中增加人物情感子项：
   - 主角想要什么。
   - 主角怕失去什么。
   - 主角会犯什么价值观或方法论误判。
   - 核心伙伴如何挑战主角，而不是只帮助主角。
2. 增强 `relationships.json` 模板或校验，支持：
   - `trust`
   - `distance`
   - `conflict`
   - `vulnerability`
   - `repair`
   - `turningPoints`
3. 在 `/tasks` 或任务生成中要求每个关系线任务说明：
   - 本任务推进哪段关系。
   - 关系状态如何变化。
   - 是否有事件证据。
4. 为慢热关系添加访谈分叉：搭档、互相利用、低烈度对立、救命债、共同调查等。

涉及文件/模块：

- `templates/tracking/relationships.json`
- `templates/tracking/character-state.json`
- `templates/clarification/slow-burn-romance.yaml`
- `templates/clarification/core.yaml`
- `src/application/interview-story.ts`
- `src/validation/rules/writing-rules.ts`
- `templates/commands/tasks.md`
- `templates/commands/write.md`

参考项目/资料：

- 参考项目：Yarn Spinner。
  借鉴点：对话节点、选项和场景动作能帮助追踪关系变化。
  不照搬：不把长篇人物关系写成游戏对话树。
  落地方式：关系追踪只记录 trust、distance、conflict、vulnerability、repair、turningPoints 等写作证据。
- 参考项目：Ink。
  借鉴点：选择会改变后续路径，人物互动不只是台词内容。
  不照搬：不引入脚本语法或 runtime。
  落地方式：慢热关系场景要标注“本场选择/行动怎样改变关系状态”。

验收标准：

- 对包含慢热感情的故事，访谈至少追问关系起点、阻力、边界和第一次信任变化。
- `creative:report` 能指出核心伙伴是否只是功能位，还是已有独立欲望和与主角的张力。
- 写作任务能标注关系变化，正文后可追踪到 evidence path。

不做/边界：

- 不强制每部作品有恋爱线；人物情感也包括师徒、伙伴、竞争、亲情、阵营信任等关系。

## Batch F8：世界观场景压力检查

类型：世界观质量、校验、Scene Card、reviewer

状态：Completed。已实现 WorldFact 场景压力字段、知识垄断等高影响设定缺失 pressure/beneficiaries/costs/violationConsequence/sceneEvidencePaths 的 warning，以及 Scene Card `worldReveal` 模板示例。

目标：让世界观从设定表落到场景压力。真实的世界观不是资料越多越好，而是规则、资源、禁令和利益结构会改变角色行动。

已有基础：

- World Bible、Canon Ledger、Entity Graph 和 Scene Card 已存在。
- `xuanhuan-cultivation` preset 已要求境界、灵力、势力秩序有代价和限制。
- reviewer loop 已有 worldbuilding 权重。

缺口：

- 世界设定可能停留在百科描述，没有落实为角色面临的选择和代价。
- `world.cultivation.*` 等 draft facts 不一定能说明谁获利、谁受损、违反规则会怎样。
- `creative-plan.md` 和 Scene Card 不一定标注世界观 reveal 如何通过行动呈现。

建议方案：

1. 为 WorldFact 增加或鼓励字段：
   - `pressure`
   - `beneficiaries`
   - `costs`
   - `violationConsequence`
   - `sceneEvidencePaths`
2. 增强 `world:check` / `validate`：
   - 对关键世界观事实缺少场景压力给 warning。
   - 对只有百科描述、没有行动影响的事实给改写建议。
3. 在 Scene Card 中要求 `reveals` 标注：
   - 揭示的世界规则。
   - 该规则如何影响角色行动。
   - 谁因此获利或受损。
4. 在 `review` 中增加“世界观是否落地到场景”检查项。

涉及文件/模块：

- `templates/world/world-bible.md`
- `templates/world/*.yaml`
- `src/domain/story-artifact.ts`
- `src/application/inspect-worldbuilding.ts`
- `src/validation/rules/writing-rules.ts`
- `templates/scenes/scene-001.yaml`
- `templates/commands/review.md`

参考项目/资料：

- 参考项目：Foam、Dendron、Logseq。
  借鉴点：世界事实应像知识节点一样能互链、能追溯、能回到证据。
  不照搬：不做完整知识图谱 UI，不要求作者维护复杂双链。
  落地方式：WorldFact 增加 pressure、beneficiaries、costs、violationConsequence、sceneEvidencePaths，并能被 Scene Card 引用。
- 参考项目：novelWriter、Manuskript。
  借鉴点：长篇世界资料需要服务章节和场景，不只是百科条目。
  不照搬：不新增独立世界观管理软件式界面。
  落地方式：`world:check` 把主线相关设定映射到行动后果和场景压力。

验收标准：

- 对“知识垄断”类设定，系统能要求说明它如何变成考试、禁书、许可、身份审查、资源分配或具体冲突。
- `world:check` 能区分“有设定文本”和“有场景压力”。
- Scene Card 的 `reveals` 能连接到 WorldFact，并说明行动后果。

不做/边界：

- 不要求所有背景设定都有完整压力模型；只对主线相关或高影响设定强制/提示。

## Batch F9：Scene Card 写作前门禁

类型：写作工作台、任务流、校验

状态：Completed。已实现 Scene Card 写作意图字段、`MISSING_SCENE_INTENT` 检查、`narrative:test` 缺卡/缺意图 warning、`check-writing-state` Scene Gate、`context:pack` 写作 mustRead 门禁，以及 `/write`、`/scene`、`/context-pack`、`/tasks` 模板同步。

目标：把 Scene Card 变成正文写作前的核心入口。真正写章节前，先确认本场景推进哪条线、揭示什么信息、改变哪段关系、建立或兑现哪个 promise、读者情绪是什么、结尾钩子是什么。

已有基础：

- `storyspec scene:init`、`scene:list`、`scene:check`、`scene:compile` 已存在。
- `templates/scenes/scene-001.yaml` 已有基础模板。
- `context:pack` 能声明 mustRead 和 allowedWrites。

缺口：

- `/write` 仍可能直接写正文，没有强制读取或生成 Scene Card。
- Scene Card 与 promise/tension/relationships/world reveals 的连接还不够强。
- 任务拆分后，写作任务不一定先经过场景意图验证。

建议方案：

1. 增强 Scene Card 模板，加入：
   - `plotThread`
   - `readerPromise`
   - `relationshipChange`
   - `worldReveal`
   - `emotionalBeat`
   - `endingHook`
   - `successCriteria`
2. 增强 `/write` prompt：
   - 写作前三章或任意章节前，优先读取对应 Scene Card。
   - 没有 Scene Card 时，先输出 Scene Card preview，不直接写正文。
3. 增强 `context:pack`：
   - 对写作任务把 Scene Card 标为 mustRead。
   - 限制 allowedWrites，避免无任务边界写整章外内容。
4. 增强 `scene:check`：
   - 检查是否推进至少一条线。
   - 检查是否有 reader emotion / ending hook。
   - 检查是否连接 promise/tension/relationship/world reveal。

涉及文件/模块：

- `templates/scenes/scene-001.yaml`
- `src/application/inspect-story-structure.ts`
- `src/application/check-writing-state.ts`
- `templates/commands/write.md`
- `templates/commands/context-pack.md`
- `src/cli/commands/story-structure.command.ts`
- `tests/unit/inspect-story-structure.test.ts`

参考项目/资料：

- 参考项目：Ink。
  借鉴点：场景节点应有进入条件、选择/行动、结果和后续路径。
  不照搬：不把 Scene Card 改造成完整脚本语言。
  落地方式：Scene Card 增加 plotThread、readerPromise、relationshipChange、worldReveal、emotionalBeat、endingHook、successCriteria。
- 参考项目：Yarn Spinner。
  借鉴点：对话、动作和命令可以结构化地表达“场景发生了什么变化”。
  不照搬：不把正文写作变成游戏事件编排。
  落地方式：`scene:check` 检查关系、信息、情绪、钩子是否至少有一项发生变化。

验收标准：

- 没有 Scene Card 的章节写作路径会优先提示创建/预览场景卡。
- Scene Card 能明确说明本场景推进的情节、信息、关系和情绪。
- `scene:check` 能发现“只有事件摘要，没有读者情绪或结尾钩子”的场景卡。

不做/边界：

- 不让 Scene Card 变成比正文还重的负担；短篇或草稿模式可允许简化卡片，但必须保留核心意图。

## Batch F10：参考作品节奏内化

类型：研究、节奏配置、文档

状态：Completed。已实现本地抽象 `rhythm-config.json`、`storyspec rhythm:init`、`tension:chart` rhythm gap 检查，以及 `/plan`、`/analyze`、README 和技术文档的版权/原创边界说明。

目标：谨慎支持“参考作品内化”：只学习节奏、结构、信息密度、爽点间隔、章节长度和情绪曲线，不复制具体剧情、人物、设定或表达。

已有基础：

- `/plan` prompt 已预留 `rhythm-config.json`。
- `tension-curve.json` 已能记录章节张力、情绪、信息收益和回报。
- 文档中已有节奏配置的引用，但功能边界尚未系统化。

缺口：

- 参考作品内化还没有明确安全边界和数据结构。
- 没有工具帮助作者把“我喜欢某本书的节奏”转成可验证的 rhythm config。
- 容易误导为模仿剧情或风格表达。

建议方案：

1. 新增设计文档或研究任务，定义 `rhythm-config.json` schema：
   - `averageChapterLength`
   - `hookFrequency`
   - `payoffInterval`
   - `dialogueActionDescriptionRatio`
   - `tensionPattern`
   - `infoRevealDensity`
2. 增加命令或文档入口：
   - `storyspec rhythm:init`
   - 或先以 `docs/tech/rhythm-config.md` 作为研究稿。
3. 在 README 和命令模板中强调：
   - 借鉴结构，不借鉴表达。
   - 不生成对标作品的角色、桥段或专有设定。
4. 让 `plan` 和 `tension:chart` 能读取 rhythm config 并提示节奏偏差。

涉及文件/模块：

- `spec/tracking/tension-curve.json`
- `templates/tracking/tension-curve.json`
- `templates/commands/plan.md`
- `src/application/*tension*`
- `docs/tech/`
- `README.md`

参考项目/资料：

- 参考项目：novelWriter、Manuskript。
  借鉴点：章节、场景和大纲可以带结构化元数据，便于长期检查节奏。
  不照搬：不做参考作品内容导入器，也不复制对标作品桥段。
  落地方式：只允许用户手工提供抽象节奏参数，写入本地 rhythm config。
- 参考资料：版权与原创边界。
  借鉴点：参考作品只能抽象为节奏、结构和信息密度。
  不照搬：不联网抓取或解析受版权保护文本。
  落地方式：命令和文档必须提示“借鉴结构，不借鉴表达”。

验收标准：

- 能用一个本地 rhythm config 表达“章节长度、爽点间隔、张力曲线、信息揭示密度”。
- plan 阶段能引用 rhythm config，但不会生成对标作品的具体剧情或人物。
- 文档明确版权和原创边界。

不做/边界：

- 本批次不联网抓取作品，不自动解析受版权保护文本；只处理用户提供的抽象节奏数据或手工配置。

## Batch F11：作者画像初始化、记忆与偏好回填

类型：记忆、个性化、提示词、状态

状态：Completed。已实现 `.specify/memory/author-profile.json`、`storyspec author-profile`、首次可跳过采样、确认/废弃/忽略/清空、`story:new`/`next`/`interview`/`creative:report`/`context:pack` 回填提示，以及 agent 模板的“画像非正典”边界。

目标：把作者画像分成三个阶段处理：第一次使用只做轻量偏好采样；创作过程中从用户选择自然沉淀画像；后续使用时再回填、复用和修正偏好，让新故事和新会话不必从零反复询问。

已有基础：

- `memory/constitution.md` 和 `memory/personal-voice.md` 已存在，能承载创作原则和表达指纹。
- `story:new`、`interview`、`creative:report` 已有连续流程，但默认更偏“当前故事”而非“作者长期画像”。

缺口：

- 作者偏好主要以自然语言模板存在，难以结构化读取、更新和复用。
- 新故事往往会重复问同类问题，例如喜欢的节奏、禁区、叙述口味、偏好冲突类型。
- 没有明确的“作者画像 vs 故事正典”边界，容易混在一起。
- 第一次使用没有历史画像可回填，如果一上来重度建档，会打断创作乐趣。

建议方案：

1. 新增 `AuthorProfile` 或类似结构，记录：
   - 题材偏好。
   - 节奏偏好。
   - 叙述风格。
   - 明确禁区。
   - 常见创作模式。
   - 状态：`provisional`、`confirmed`、`deprecated`。
2. 第一次使用时只做轻量偏好采样：
   - 默认 2-4 个高价值问题。
   - 必须允许跳过。
   - 只影响推荐和示例，不影响故事正典。
   - 采样结果默认标记为 `provisional`。
3. 创作过程中自然沉淀画像：
   - 从用户多次选择中形成候选偏好。
   - 候选偏好必须允许用户确认、修正或拒绝。
   - 不把单次故事选择直接提升为长期偏好。
4. 后续使用时在 `story:new`、`interview`、`plan`、`report` 中回填作者画像，作为默认上下文而非正典。
5. 支持作者显式修改、覆盖、清空或暂时忽略画像。
6. 在提示词中区分：
   - 作者长期偏好。
   - 临时/待确认偏好。
   - 当前故事确认。
   - 当前故事待澄清。

涉及文件/模块：

- `memory/constitution.md`
- `memory/personal-voice.md`
- `src/application/story-onboarding.ts`
- `src/application/interview-story.ts`
- `src/application/story-context.ts`（如需新增）
- `templates/commands/*`

参考项目/资料：

- 参考项目：Foam、Dendron、Logseq。
  借鉴点：个人知识库的长期记忆、可修正条目和本地优先存储。
  不照搬：不做通用个人知识管理，也不把作者画像变成不可见监控。
  落地方式：AuthorProfile 条目必须有状态、来源、最近确认时间和关闭/忽略方式。
- 参考项目：Inquirer.js、Yeoman。
  借鉴点：首次使用只问最少必要问题，且允许跳过。
  不照搬：不做重度 onboarding 问卷。
  落地方式：首次偏好采样默认 2-4 个问题，结果为 `provisional`。

验收标准：

- 首次使用时只出现轻量偏好采样，问题数量不超过 4 个，并且可以跳过。
- 首次采样结果标记为 `provisional`，只影响推荐，不影响正典。
- 后续新故事启动时能自动带入作者的已确认风格偏好，减少重复提问。
- 作者可以手动更新或关闭某条画像偏好。
- 作者画像不会被写成故事正典，也不会覆盖用户对当前故事的明确回答。

不做/边界：

- 不把作者画像变成监控或打分系统；它只服务创作体验。
- 不把第一次使用变成重度问卷；画像应随创作慢慢长出来。

完成记录：

- 完成内容：新增作者画像领域模型、应用服务和 CLI；新项目会携带空画像模板；上下文包和 agent prompt 会读取画像但标注非正典边界。
- 验证方式：`npm run build`；相关单测覆盖作者画像、story onboarding、interview、creative report、context pack、init/upgrade。
- 产物/文件：`src/domain/author-profile.ts`、`src/application/manage-author-profile.ts`、`src/cli/commands/author-profile.command.ts`、`memory/author-profile.json`、`docs/tech/author-profile.md`。
- 后续遗留：创作过程中从多次用户选择自然沉淀候选画像可在 F15 决策日志/未决项回流中继续增强。

## 完成后需要同步

- 更新 [story-co-creation-interview-roadmap.md](story-co-creation-interview-roadmap.md) 中对应批次状态。
- 更新 [todo-index.md](../../todo-index.md) 的当前下一步。
- 涉及 CLI、模板、生成产物或验证变化时新增 changeset。
- 按影响面运行构建、测试、command manifest 和 changeset 检查。
