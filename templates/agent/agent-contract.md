# StorySpec Agent 合约

## 项目身份

- 这是名为 `{{PROJECT_NAME}}` 的 StorySpec 小说项目。
- 项目协议保持 agent-neutral。Codex、Claude、Gemini、Cursor、通用 Markdown agent 和其他工具都是集成入口。
- CLI 负责管理项目文件和验证流程；它不是写作 agent。
- 除非项目文件另有说明，面向作者的说明、计划和交接内容使用中文。

## 读取顺序

1. `AGENTS.md`
2. `.specify/agent-contract.md`
3. `.specify/memory/constitution.md`
4. `stories/*/specification.md`
5. `stories/*/creative-plan.md`
6. `stories/*/tasks.md`
7. `spec/tracking/*.json`
8. `spec/knowledge/*`
9. `stories/*/content/*`

## 写入边界

- 只编辑当前任务明确允许的文件。
- 规划任务可以更新规划文件，但不得撰写章节正文。
- 写作任务可以更新任务声明的章节内容和追踪文件。
- 保持 tracking JSON 有效，并保留作者已经写入的故事数据。
- 如果边界不清楚，新增或请求澄清任务，不要猜测扩写。

## 任务状态规则

- 开始聚焦工作时，只把一个任务标记为 `in_progress`。
- 只有在所需输出已经存在，且已运行验证或记录清楚验证限制后，才把任务标记为 `done`。
- 完成某个任务时，不要顺手把无关任务标记为完成。

## 追踪规则

- 写作或修订内容后，更新受影响的情节、时间线、关系、角色和知识追踪文件。
- 新引入的事实必须记录为有证据支持的条目；不要把 agent 猜测当成 canon。
- 如果某个事实需要作者确认，标记为 pending，不要静默写入 canon。

## 交接规则

- 长会话结束前，如果项目已经使用 handoff 文件，创建或更新 `handoff.md`。
- 写明当前故事、活跃任务、变更文件、验证结果、阻塞项和建议的下一步。

## 验证规则

- 完成一个阶段前，如果可使用 shell，运行 `storyspec validate`。
- 如果无法使用 shell，手动检查必需读取/写入文件，并记录无法验证的内容。
- 自动化 agent 优先使用 JSON 输出：`storyspec validate --json`。

## 通用 Agent 兜底

- 如果 slash commands 不可用，读取 `.specify/commands/*.md`，并手动遵循对应命令文档。
- 如果 shell commands 不可用，直接执行文档中列出的文件读取和写入步骤。
- 如果无法写入文件，返回 patch-style 计划，列出精确目标路径和内容变更。

## 内容边界

- 高风险或敏感故事元素应按情节功能、动机、同意边界、关系变化、后果和任务元数据处理。
- 不要越过当前任务边界扩展敏感素材。
- 保留共情、主体性、余波和作者意图。

## 活跃画像

{{AGENTS_PROFILE_SECTION}}
