## ADDED Requirements

### Requirement: 发布产物必须暴露 finish 相关 CLI
发布产物中的 CLI MUST 在 help 输出里暴露 `task:finish` 和 `tasks:set-status`，并且这些命令 MUST 可用于完成一次任务收尾流程。

#### Scenario: help 输出包含 finish 命令
- **WHEN** 用户运行构建后的 `dist/cli.js --help`
- **THEN** help 输出 MUST 包含 `task:finish` 和 `tasks:set-status`

#### Scenario: 发布产物可直接执行收尾命令
- **WHEN** 用户在发布产物中执行 `task:finish`
- **THEN** 命令 MUST 可被解析并进入对应的收尾流程

### Requirement: finish MUST 识别嵌套和短路径草稿
finish 流程 MUST 识别与当前任务相关的草稿文件，包括 `content/chapter-*.md`、`content/volume*/chapter-*.md` 和短路径章节文件。

#### Scenario: 识别嵌套 volume 草稿
- **WHEN** finish 扫描到 `content/volume1/chapter-003.md`
- **THEN** 该文件 MUST 被视为 related draft

#### Scenario: 识别短路径章节文件
- **WHEN** finish 扫描到与当前任务关联的 `chapter-003.md`
- **THEN** 该文件 MUST 被视为 related draft

### Requirement: finish MUST 输出单屏收尾报告
finish 流程 MUST 以单一收尾报告呈现任务验收、task board、正文和 tracking 的结果。

#### Scenario: 成功完成收尾
- **WHEN** 任务被标记为 finish 成功
- **THEN** 系统 MUST 在同一份报告中给出任务、task board、正文和 tracking 的结果

#### Scenario: 部分信息缺失
- **WHEN** 某个收尾分区无法确认
- **THEN** 系统 MUST 在同一份报告中标记缺失项，而不是拆成多个输出块
