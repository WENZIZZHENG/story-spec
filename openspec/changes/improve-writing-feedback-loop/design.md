# Design: 改进写作反馈闭环

## Goals

- 让作者在写章开始后尽快看到方向性成果，而不是等待完整章节一次性返回。
- 让 agent 在写单章时使用最小上下文包，减少重复读取和无目的扫描。
- 让卷计划生成后有一屏内的作者可读摘要，增强“故事已经长出来”的正反馈。

## Non-goals

- 不开发 GUI、Web 工作台或交互式图形编辑器。
- 不承诺模型生成速度本身变快。
- 不跳过 tracking、验证、preview / confirm / apply 或作者确认。
- 不把 Mermaid/Markdown 视图作为正典来源；视图只反映已确认信息和明确标注的候选信息。

## Key Decisions

### 1. 写章反馈分为计划、正文、收尾三段

写章流程必须先给 3-6 条 scene beat 或进度摘要，再进入正文分块输出，最后给收尾验证摘要。beat 是方向预览，不等同于完成正文；正文分块可以按 scene、段落组或目标字数拆分；收尾摘要必须说明已写文件、已更新或建议更新的 tracking、验证结果和下一步。

### 2. 上下文包以任务或章节为主要 scope

`context:pack` 的新增契约以 `task` 和 `chapter` 为一等范围。默认单章写作包应包含当前任务、当前 Scene Card、上一章摘要、相关角色/关系/伏笔/张力 tracking、卷计划摘要和允许写入路径。全卷资料只能在明确需要或用户指定时进入包。

### 3. 摘要视图只做 Markdown/Mermaid

计划摘要和后续关系/张力/角色弧线视图采用 Markdown 表格、列表和 Mermaid 文本。这样能服务 CLI、agent 和文档工作流，同时避免 GUI 依赖和额外运行环境。

### 4. 未确认信息必须显式降级

一屏摘要、scene beat、关系图和张力表都不能把候选内容伪装成正典。来源不足时应显示“待确认”“资料不足”或 evidence 缺口，并保留作者确认权。

### 5. 人类文本和 JSON 事件同时稳定

人类输出应短而清楚；JSON 输出应包含稳定 stage、scope、artifacts、warnings、nextActions 等字段，便于 agent 自动接续。后续实现可渐进添加字段，但不得要求 agent 解析中文文本才能判断下一步。

## Risks

- 风险：阶段性 beat 被误认为正文已完成。缓解：输出中明确 stage，并在正文完成前不标记 finish。
- 风险：最小上下文包漏掉关键正典事实。缓解：包必须声明 included、omitted、warnings 和 required follow-up reads；写入前仍跑阶段验证。
- 风险：摘要视图诱导工具脑补缺失章节、关系或角色弧线。缓解：缺失信息必须标记为待确认，不能自动补完。
- 风险：为追求快反馈而绕过作者控制权。缓解：preview / confirm / apply 边界保持不变，高影响设定和正典写入仍需来源与确认。

## Migration

- 既有项目无需迁移即可继续使用长文计划和普通写章流程。
- 新的 context pack scope 可作为增量能力加入；没有 task/chapter 参数时保持现有默认行为。
- 计划摘要可从现有 creative plan、tracking 和 report 数据派生；资料不足时输出缺口，不修改旧文件结构。
- 如果后续添加 JSON progress events，应保持旧字段兼容，并在命令帮助或 changelog 中说明新增字段。
