# Proposal: 改进写作反馈闭环

## Why

StorySpec dogfood 暴露出一个关键体验问题：第一章、第二章生成等待时间偏长时，作者长时间看不到阶段性成果，会误以为流程卡住。耗时不只来自正文生成，也来自上下文读取、计划核对、tracking 更新和收尾验证。当前工具已经具备 `context:pack`、卷计划、draft 和 task finish 等基础能力，但缺少面向作者的正反馈协议和更小粒度的上下文包。

这个 change 聚焦把“等很久才看到一整章”改成“先看到本章方向，再分块看到正文，最后看到收尾结果”。同时让卷计划输出一屏内可理解摘要，帮助作者确认故事已经成形，而不必先阅读长篇 Markdown。

## What

- 为写章流程定义阶段性反馈契约：先输出 3-6 条 scene beat 或进度摘要，再分块产出正文，最后输出收尾验证摘要。
- 为 `context:pack` 定义按 task/chapter 生成最小上下文包的行为契约，减少反复扫描整卷资料。
- 为卷计划和创作报告定义一屏摘要视图：三幕结构、12 章节奏、角色弧线、剧情起伏、人物关系。
- 为后续 Mermaid/Markdown 关系图、张力表、角色弧线表定义可选输出能力，但不开发 GUI。

## Capabilities

- `chapter-progress-feedback`：写章命令和 agent prompt 必须提供可观察的阶段进度、scene beat、正文分块和收尾摘要。
- `scoped-context-pack`：上下文包可以按任务或章节限定读取范围，并输出可复用的最小上下文清单。
- `plan-digest-views`：计划预览或创作报告可以输出一屏摘要，并在资料不足时标明待确认而不是编造。

## Impact

- 影响 CLI/agent 行为契约、命令模板、JSON 输出字段和相关测试 fixture。
- 影响写章前上下文准备、章节收尾报告和卷计划预览的用户可见输出。
- 不改变正典确认边界：未确认内容仍必须标为 candidate / 待确认。
- 不实现 GUI，不引入 Web 工作台；可视化仅限 Markdown 表格和 Mermaid 文本。
