## 设计

`task:finish` 的第一层失败门禁先落在应用服务 `finishWritingTask` 内，而不是 CLI 层。这样 CLI、未来 agent 自动化和单元测试都复用同一套阻断规则。

源文件只修改 `src/application/finish-writing-task.ts` 和 CLI 渲染相关代码；`dist/` 仍由 `npm run build` 生成，不手工编辑。

## 行为边界

- 预览模式继续只展示任务、关联正文和验证计划，不阻断。
- apply 模式先运行本地文件检查；如果任务关联的 Markdown 正文 / 草稿路径缺失，则返回 `blocked: true`，`applied: false`，且 `updatedFiles` 为空。
- 若任务没有可识别的正文路径，本次不阻断，避免误伤非正文类任务。
- 本次不执行外部验证命令；只把文件存在性门禁作为第一层保障。

## 输出模型

新增最小结构：

- `blocked`: 是否被门禁阻断。
- `checks`: 检查项列表，包含 `id`、`label`、`status`、`message` 和可选 `paths`。
- `blockedReasons`: 给人类和 JSON 消费方读取的阻断原因。
- `nextActions`: 阻断后的建议动作。

## 后续扩展

后续 `style:lint`、`narrative:test`、`review` 失败门禁可继续复用 `checks` 结构，不需要改动 `task-board.json` 或任务 Markdown schema。
