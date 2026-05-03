---
change_type: minor
scope: cli,templates,docs,tests
---

# 多入口共创工作台

## CLI 行为

- `storyspec next` 新增创作模式视图，显示 `discover`、`co-create`、`plan`、`write`、`reflect` 的当前状态、命令和边界。
- `storyspec next` 的共创入口改为“你想从哪里继续？”，展示主角、伙伴、世界、舞台、能力、势力、冲突、场景、结尾/反转和分支入口。
- `storyspec interview` / `storyspec clarify` 新增 `--focus <entry>`，可从指定入口插入本轮焦点问题。

## 模板契约

- `/clarify` 模板补充多入口共创说明，明确指定焦点只改变访谈切入点。
- 所有入口输出默认是候选，不绕过用户确认，不直接写入 specification、World Bible、Scene Card、tracking 或 tasks。

## 生成产物

- agent 命令产物会同步更新 `/clarify` 的多入口说明。
- 命令 manifest 需要随模板重新生成，确保各 agent integration 的澄清命令内容一致。

## 文档

- README、命令速查和快速入门增加 `storyspec next` 多入口导航与 `storyspec interview --focus` 示例。
- 创作工作台路线图记录 F12 完成状态，并把下一步推进到 F13 分叉可视化。

## 验证

- `npm run build`
- `npm test -- tests/unit/story-onboarding.test.ts tests/unit/interview-story.test.ts`
- `npm run test:smoke`
- `npm run build:commands`
- `npm run check:command-manifest`
- `npm run check:changes`
