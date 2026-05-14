## Why

用户已经明确反馈当前 Web 太丑、打开后不知道怎么用。虽然完整多人在线 App 仍要独立前端承载，但当前 `storyspec app` 是用户立刻会看到的入口；它需要更明确的首屏路径，告诉用户先做什么、每一步会不会写入正式故事，以及遇到候选/正典/任务时从哪里进入。

## What Changes

- 在本机 App shell 首屏加入“开始路径”引导，固定展示打开/创建项目、创建或选择故事、继续写作或审阅候选三步。
- 用工作室控制台视觉语言呈现步骤、当前动作和写入边界，不做营销 hero。
- 补充 local app HTML 单元测试，确保引导文案、锚点和响应式安全边界存在。
- 同步 App UX 待办和 changeset。

## Non-goals

- 不引入独立前端框架。
- 不实现账号、云端、多人实时协作或富文本编辑器。
- 不改变任何本机 App API 行为。

## Impact

影响 `src/app-server/local-app-html.ts`、`tests/unit/local-app-html.test.ts`、App UX 路线图和 changeset。这是当前 Web 可用性改进，不是最终完整 App。

## Capabilities

- `local-app-guided-first-run`
