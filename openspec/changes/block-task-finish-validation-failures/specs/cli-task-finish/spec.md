## MODIFIED Requirements

### Requirement: finish MUST 输出单屏收尾报告
finish 流程 MUST 以单一收尾报告呈现任务验收、task board、正文和 tracking 的结果。

#### Scenario: 成功完成收尾
- **WHEN** 任务被标记为 finish 成功
- **THEN** 系统 MUST 在同一份报告中给出任务、task board、正文和 tracking 的结果

#### Scenario: 部分信息缺失
- **WHEN** 某个收尾分区无法确认
- **THEN** 系统 MUST 在同一份报告中标记缺失项，而不是拆成多个输出块

#### Scenario: 验证命令失败时阻断 apply
- **GIVEN** 当前任务关联正文已存在
- **AND** 收尾验证命令返回失败
- **WHEN** 用户运行 `task:finish T001 --apply`
- **THEN** 系统 MUST 返回阻断结果
- **AND** 系统 MUST NOT 修改 `tasks.md`
- **AND** 系统 MUST NOT 写入或刷新 `task-board.json`
- **AND** 输出 MUST 包含失败命令和下一步建议
