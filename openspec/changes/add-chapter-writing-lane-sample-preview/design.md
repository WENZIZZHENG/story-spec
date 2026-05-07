## 设计

本 change 用一个轻量“章节写作通道”收紧入口，而不是重做章节编辑器。通道是只读状态模型，负责把现有产物组合成下一步建议；章节小样是 prompt/模板层的确认阶段，负责降低完整正文返工成本。

## 章节写作通道

新增 application/app server 级 `getChapterWritingLane`：

- 输入：`story?`、`chapter?`，从当前 App session 的项目根目录读取。
- 输出：
  - `lane`: 固定顺序阶段数组：`outline`、`tasks`、`scene`、`sample`、`draft`、`review`。
  - 每个阶段包含 `id`、`label`、`status`、`summary`、`nextAction`、`blockedReasons`、`commands`。
  - `currentStep` 指向第一个 `blocked` 或 `ready` 阶段；全完成时指向 `review`。
  - `boundaries` 明确不会自动写入正文、tracking、canon、tasks。
- 状态来源第一版保持保守：
  - `outline`：检查故事目录下 `creative-plan.md` 是否存在。
  - `tasks`：复用 `exportTaskBoard({ write: false })` 的 summary，优先识别 `writeReady` 和 `planOnly`。
  - `scene`：检查 `stories/<story>/scenes/` 中是否有 Scene Card；若指定 chapter，可只用 chapter/scene 命名做弱匹配，找不到则提示 `scene:init`。
  - `sample`：提示 `/write` 的 `阶段 1.5 - 章节小样`，不要求落盘。
  - `draft`：复用 `listDrafts()` 判断指定章节是否已有 draft。
  - `review`：有 draft 或正式正文时可运行 review，否则等待草稿。

## API 和 App

- Core 方法：`core.getChapterWritingLane({ token, story?, chapter? })`。
- HTTP：`GET /api/chapters/lane?story=&chapter=`。
- UI：章节入口顶部新增“写作通道”区域，使用现有故事名和章节输入，点击后展示：
  - 当前阶段。
  - 每个阶段的状态。
  - 下一步命令或 App 动作。
  - 写入边界。

所有新增 API 继续要求 `x-storyspec-app-token`，并只作用于当前已打开/创建项目。

## 章节小样

Prompt 和模板层新增阶段：

```text
阶段 0：章节前置约束卡
阶段 1：beat 预览
阶段 1.5：章节小样
阶段 2：完整正文块
阶段 3：收尾验证
```

小样要求：

- 800-1500 字左右，像缩略正文，不是纯大纲。
- 只用于确认读感、情绪顺序、人物反应、冲突推进、尺度边界和文风方向。
- 默认不写入正式正文、不更新 tracking、不进入 canon。
- 作者可以确认、要求改写、补约束或退回 beat。
- 完整章节必须以确认后的小样为依据继续扩写，但仍服从 Scene Card、任务边界、约束卡和写后自检。

JSON 阶段兼容现有 `plan / write / finish`：章节小样仍属于 `plan`，避免破坏现有 agent 输出解析。

## 文档和待办

- README 只写真实可用能力：本机 App 有章节写作通道状态；`/write` 有章节小样阶段。
- `docs/tech/project-optimization-roadmap.md` 中 P0 改为 Completed，并把完成证据写入 `todo-archive.md`。
- `todo-index.md` 移除 P0 活跃入口或降级剩余 P2。

## 验证

- OpenSpec strict validate。
- Unit：
  - App core：token、未打开项目、lane 输出和边界。
  - HTTP：`/api/chapters/lane` token 和返回。
  - HTML：写作通道区域和 API wiring。
  - build commands：真实 `/write` 生成产物包含章节小样阶段。
  - authoring template：章节卡包含小样确认说明。
- 集成：`npm run build`、`npm run build:commands`、`npm run check:command-manifest`、`npm run check:changes`、相关 smoke、`git diff --check`。
