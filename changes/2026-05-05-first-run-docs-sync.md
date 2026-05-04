---
change_type: patch
scope: cli,docs,templates
---

# 同步首程 onboarding、写作反馈和视图文档

## CLI 行为

- `status --json` / `codex-status --json` 的首程输出包含稳定 `navigationEntries.action` 与可复制命令，供 agent/UI 不依赖中文文案解析。
- `next --json` 的 action 使用固定枚举；人类首屏保留素材入口和次级可复制命令区。
- 文档中的首次路径统一为先指定工作区，再保存原始灵感并进入 `storyspec next`。

## 模板契约

- agent guide 补充长文、表格和多回复导入的 candidate / preview / confirm / apply 门禁说明。
- 明确“待澄清不是失败”，确认后才进入正典。
- `write` 命令模板增加三阶段反馈契约：`plan` 输出 scene beat 预览，`write` 输出正文分块进度，`finish` 输出验证摘要。

## 生成产物

- 命令模板源变化需要同步 `tests/fixtures/command-artifacts.manifest.json`。
- manifest 必须记录 `npm run build` 后的 runtime + command artifact 状态；不要在 `npm run build:commands` 清理 `dist` 后更新 manifest。

## 验证

- README 的首个体验示例改为先指定工作区路径，再进入 `storyspec story:new` 和 `storyspec next`。
- 快速入门补充首程路径顺序：先工作区，再素材入口，再复制命令。
- agent guide 补充长文、表格和多回复导入的 candidate / preview / confirm / apply 门禁说明。
- 不承诺未实现能力。
- 仍强调长文与表格资料里的待澄清不是失败，确认后才进入正典。
- 需要运行 `npm run build`、`npm run update:command-manifest`、`npm run check:command-manifest` 和最终 `npm run verify`。
