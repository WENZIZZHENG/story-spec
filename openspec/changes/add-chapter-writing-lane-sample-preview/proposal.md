## Why

当前 P0 待办要求先收紧章节写作链路，再在完整章节生成前加入“章节小样”。现有能力已经覆盖候选大纲、任务板、Scene Card、章节草稿、发布 dry-run 和写后自检，但这些入口仍像一组分散按钮。作者进入写章时，需要自己判断当前卡在大纲、任务、Scene Card、草稿还是 review。

同时 `/write` 现有流程是“约束卡 -> beat 预览 -> 正文块 -> 写后自检”。beat 能说明本章准备写什么，但不能让作者提前感受读起来的情绪、身体感、叙事口吻和尺度。一次性生成完整章节后再返工，成本高，也容易在正文已经生成后才发现人物反应或节奏不对。

## What Changes

- 新增章节写作通道状态能力，串联 `outline -> tasks -> scene -> sample -> draft -> review`：
  - App server core 提供只读 `getChapterWritingLane` 方法。
  - HTTP 新增 `/api/chapters/lane`。
  - 本机 App 章节入口展示当前链路阶段、下一步、阻断原因和不会自动写入的边界。
- 章节写作 prompt 增加 `阶段 1.5 - 章节小样`：
  - 约束卡和 beat 确认后，先输出 800-1500 字左右的精简预览稿。
  - 小样用于确认读感、情绪顺序、人物反应、冲突推进、尺度边界和文风方向。
  - 小样默认不写入正式正文、不更新 tracking、不进入 canon。
  - 作者确认或改写小样后，才进入完整章节分块生成。
- 章节卡模板、agent guide、README、changeset 和待办路线同步真实能力与边界。

## Non-goals

- 不新增富文本编辑器、在线正文编辑器或复杂版本管理。
- 不自动调用 AI 生成正文。
- 不让章节小样自动进入正式正文、tracking、canon 或 tasks。
- 不取消 beat 预览、Scene Card、任务门禁、约束卡或写后自检。
- 不实现账号系统、云端同步或多人协作。

## Impact

影响范围包括 `src/app-server/local-app-server.ts`、`src/app-server/local-app-http-server.ts`、`src/app-server/local-app-html.ts`、`src/cli/commands/app.command.ts`、章节写作 prompt 和 authoring 模板、agent guide、README、changeset、待办和归档文档，以及相关 unit/smoke/command artifact 测试。不手工编辑 `dist/**`，命令产物通过 `npm run build:commands` 生成。

## Capabilities

- `local-app-chapter-entry`
- `chapter-preflight-constraint-card`
- `chapter-writing-lane-sample-preview`
