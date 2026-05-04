## ADDED Requirements

### Requirement: 验证结果必须包含 scope 和 severity
写作验证结果 MUST 为每条 finding 提供 `scope` 和 `severity`，用于区分问题属于哪一类，以及是否会阻断 finish。

#### Scenario: 未开始任务输出缺失
- **WHEN** 系统发现任务没有开始输出
- **THEN** 该 finding MUST 带有明确的 task 相关 scope 和可区分的 severity

#### Scenario: planned foreshadowing
- **WHEN** 系统发现 planned foreshadowing
- **THEN** 该 finding MUST 带有与预设伏笔相关的 scope，且 severity MUST 与阻断类问题不同

#### Scenario: 长文导入澄清
- **WHEN** 系统发现长文导入需要澄清
- **THEN** 该 finding MUST 带有与导入相关的 scope，且 severity MUST 与其他验证噪音区分开

### Requirement: 非阻断 finding 不得中断 finish
写作验证结果中的非阻断 severity MUST 仍然可见，但 MUST NOT 中断 finish 完成。

#### Scenario: 信息类提示
- **WHEN** 验证结果只包含信息类 finding
- **THEN** finish MUST 继续完成并在报告中展示这些提示

#### Scenario: 阻断类问题
- **WHEN** 验证结果包含阻断类 finding
- **THEN** finish MUST 暂停并提示用户先处理阻断项

### Requirement: 验证摘要必须按 scope 和 severity 汇总
验证摘要 MUST 按 scope 和 severity 汇总 finding，以便收尾报告能直接呈现问题分布。

#### Scenario: 多类 finding 同时存在
- **WHEN** 一次写作检查产生多个不同 scope 的 finding
- **THEN** 摘要 MUST 分组显示每个 scope 的数量和 severity 分布
