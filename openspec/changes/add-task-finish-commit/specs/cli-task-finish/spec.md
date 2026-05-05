## MODIFIED Requirements

### Requirement: finish MUST 输出单屏收尾报告
finish 流程 MUST 以单一收尾报告呈现任务验收、task board、正文和 tracking 的结果。

#### Scenario: 成功完成收尾
- **WHEN** 任务被标记为 finish 成功
- **THEN** 系统 MUST 在同一份报告中给出任务、task board、正文和 tracking 的结果

#### Scenario: 部分信息缺失
- **WHEN** 某个收尾分区无法确认
- **THEN** 系统 MUST 在同一份报告中标记缺失项，而不是拆成多个输出块

#### Scenario: apply 成功后创建本地 commit
- **GIVEN** 当前任务关联正文已存在
- **AND** `task:finish --apply` 会更新 `tasks.md` 和 `task-board.json`
- **AND** Git 工作区没有 unrelated change
- **WHEN** 用户运行 `task:finish T001 --apply --commit`
- **THEN** 系统 MUST stage 本次更新文件
- **AND** 系统 MUST 创建本地 commit
- **AND** 输出 MUST 包含 commit message

#### Scenario: unrelated change 存在时跳过 commit
- **GIVEN** `task:finish --apply` 已更新任务状态
- **AND** Git 工作区存在不属于本次更新文件的 change
- **WHEN** 用户请求 `--commit`
- **THEN** 系统 MUST NOT 创建 commit
- **AND** 输出 MUST 说明存在 unrelated change
