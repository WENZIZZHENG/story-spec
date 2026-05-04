## Why

StorySpec 的 dogfood 已经暴露出一组连在一起的收尾摩擦：任务能写，但 finish 不能稳定地把正文、tracking 和 task board 一次性收拢，验证噪音也没有按场景分层，作者很难判断哪些是阻断问题、哪些只是提示。

同时，CLI 产物与源码之间已经出现漂移，`dist/cli.js --help` 不是可靠的验收入口，说明这次需要把可见命令、路径匹配、验证语义和 tracking 兼容性一起补齐。

## What Changes

- 让 `task:finish` 和 `tasks:set-status` 在发布产物中保持可见，并把 help、构建和 smoke 验证纳入交付标准。
- 扩展 finish 阶段的 related draft 识别，支持 `content/chapter-*.md`、`content/volume*/chapter-*.md` 和短路径章节文件。
- 为写作验证结果增加 `scope` 与 `severity` 维度，区分未开始任务输出缺失、planned foreshadowing、长文导入澄清等不同噪音。
- 为 tracking 记录增加旁路 `evidence` 字段，保留 `completedNodes` 字符串数组兼容性，并补齐迁移和校验要求。
- 补足任务验收、task board、正文与 tracking 的收尾报告，形成一次 finish 的完整闭环回执。

## Capabilities

### New Capabilities

- `cli-task-finish`: finish 相关 CLI 命令在发布产物中的可见性、可用性和收尾报告行为。
- `writing-validation-scope`: 写作验证结果的 scope / severity 分类、噪音分层与 finish 阻断规则。
- `tracking-evidence`: tracking 记录的 evidence 旁路字段、旧格式兼容性和迁移校验。

### Modified Capabilities

- 

## Impact

受影响范围包括 CLI 构建和分发产物、finish 流程、写作验证输出、tracking 记录 schema、迁移校验、smoke 测试和 manifest 检查。现有 `completedNodes` 读取方必须继续看到字符串数组，不可被破坏。
