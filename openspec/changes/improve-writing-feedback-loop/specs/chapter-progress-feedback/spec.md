# chapter-progress-feedback Specification

## ADDED Requirements

### Requirement: 写章必须先给阶段性方向反馈

写章流程 SHALL 在开始长正文生成前输出 3-6 条 scene beat 或等价的章节进度摘要。

#### Scenario: 第一章开始生成

- GIVEN 作者请求写第一章
- WHEN 写章流程完成当前章节的必要上下文确认
- THEN 输出 SHALL 包含 3-6 条 scene beat
- AND 每条 beat SHALL 描述本章将推进的场景、冲突、情感或信息功能
- AND 输出 SHALL 明确这些 beat 是写作计划或方向预览，不是已完成正文

#### Scenario: 资料不足以给出可靠 beat

- GIVEN 当前任务缺少必要 Scene Card、卷计划或上一章摘要
- WHEN 写章流程无法可靠生成 beat
- THEN 输出 SHALL 给出进度摘要和缺失上下文列表
- AND SHALL 给出下一步可执行操作
- AND SHALL NOT 编造已确认剧情事实

### Requirement: 正文生成必须可分块观察

写章流程 SHALL 在长章节生成中按 scene、段落组或目标字数分块输出正文进度。

#### Scenario: 长章节分块写入

- GIVEN 目标章节需要多个场景或超过单次输出预算
- WHEN 第一块正文完成
- THEN 输出 SHALL 标明正文阶段已经开始
- AND SHALL 标明当前已完成的块和剩余块概况
- AND SHALL 保留继续写作所需的 checkpoint 或上下文摘要

#### Scenario: 用户中断后恢复

- GIVEN 写章流程已经输出 beat 和至少一个正文块
- WHEN 用户请求继续当前章节
- THEN 流程 SHALL 能基于最近 checkpoint 或上下文摘要恢复
- AND SHALL NOT 要求从头重写已完成正文块

### Requirement: 收尾必须输出一屏验证摘要

写章流程 SHALL 在正文完成后输出收尾摘要，说明写入结果、验证结果、tracking 状态和下一步。

#### Scenario: 章节正文完成

- GIVEN 当前章节正文已经生成
- WHEN 收尾阶段执行
- THEN 输出 SHALL 列出正文路径或 draft 路径
- AND SHALL 列出已执行或建议执行的验证
- AND SHALL 列出已更新、待更新或需要作者确认的 tracking 项
- AND SHALL 给出下一章或当前章节修订的 next action

#### Scenario: 验证发现当前必须处理的问题

- GIVEN 收尾验证发现当前章节缺少必需输出或违反当前任务约束
- WHEN 输出收尾摘要
- THEN 摘要 SHALL 将 due-now 问题与 future/planned-later 信息区分
- AND SHALL NOT 把未来章节正常未完成事项作为当前失败主因
