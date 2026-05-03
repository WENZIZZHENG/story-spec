对小说项目执行阶段化分析。

用户输入：$ARGUMENTS

## 阶段识别

1. 运行 `{SCRIPT}` 获取当前创作状态。
2. 如果存在 `.specify/memory/author-profile.json`，只把它作为作者偏好上下文，用来判断推荐是否贴近作者选择；不要把它当作故事正典或质量评分标准。
3. 如果用户传入 `--type=framework`，执行框架一致性分析。
4. 如果用户传入 `--type=content`，执行内容质量分析。
5. 如果用户传入 `--focus`，在对应专项维度上加深分析。
6. 如果没有显式参数，根据已有章节数量自动选择分析模式。

## 框架一致性分析

用于写作前检查准备是否充分。

必须覆盖：

- 宪法、规格、创作计划和任务清单是否一致。
- P0/P1/P2 需求是否被计划和任务覆盖。
- 时间线、角色能力、世界规则和因果关系是否存在冲突。
- 当前是否已经具备开始写作的必要条件。

输出建议包含：

- 覆盖率分析。
- 一致性问题。
- 阻塞项与风险。
- 是否建议开始写作。

## 内容质量分析

用于写作后检查已完成内容质量。

必须覆盖：

- 正文是否符合宪法、规格和计划。
- 已完成章节与任务清单是否对应。
- 角色、关系、时间线、伏笔和世界规则是否连续。
- 节奏、可读性、风格一致性和具体化表达是否达标。

输出建议包含：

- 总体评分。
- 关键发现。
- P0/P1/P2 改进建议。
- 推荐下一步行动。

## 专项分析

支持以下 `--focus`：

- `opening`：检查开篇吸引力、信息密度和前三章节奏。
- `pacing`：检查冲突密度、爽点间隔和高潮分布。
- `character`：检查人物弧光、动机和关系演变。
- `foreshadow`：检查伏笔埋设、回收与遗漏。
- `logic`：检查时间线、因果链、能力设定和世界规则。
- `style`：检查文风、句式、用词和风格参考一致性。
- `world-density`：按 chapter/scene 统计 WorldFact、CanonFact 与 Scene Card 承载密度，识别设定堆砌。
- `reveal-pacing`：检查 reveals、foreshadowing、worldElements 和 canonFacts 是否形成清晰揭示节奏。
- `creative-control`：检查 `clarifications.json` 中未确认 AI 建议、required 未答问题和用户明确边界是否被 specification、plan、tasks 或正文提前定稿。

## Reviewer Loop

- 可运行 `storyspec review --json` 获取结构化 reviewer findings。
- findings 必须保留 `path`、`severity`、`evidence`、`suggestedAction`。
- reviewer loop 只生成建议和任务草稿，不直接覆盖正文。
- 如果出现 `CREATIVE_INTENT_DRIFT_*`，分析报告必须单列“创作控制权”维度，要求先澄清或转任务草稿，不得自动改写正文。

## 写入边界

- 默认将正式分析报告写入 `stories/*/analysis-report.md`。
- 如果需要保存阶段性或专项报告，可写入 `spec/reports/**`。
- 不修改正文内容；只给出可执行修订建议。
