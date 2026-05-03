---
change_type: minor
scope: domain,validation,status
---

# 故事成熟度模型

## CLI 行为

- `novel status` 现在会显示当前故事的创作阶段、创作缺口和下一步问题。
- `novel validate` 对 `idea` / `interviewing` 阶段不再提示缺少 `specification.md`、`creative-plan.md` 或 `tasks.md`。
- CLI 参数保持不变；`status --creative` 尚未新增，创作状态已先合入默认 status 输出。

## 模板契约

- 新增早期故事状态文件约定：`stories/<story>/idea.md`、`stories/<story>/clarifications.md`、`stories/<story>/clarifications.json`、`stories/<story>/candidates.md`。
- `idea` 和 `interviewing` 是合法早期状态，不要求用户立即生成完整规格、计划或任务。
- `specified` / `planned` 阶段缺少后续产物时只作为 info 提醒，避免把正常创作推进误判为结构问题。

## 生成产物

- 本批次未改变命令模板编译输出，不需要更新 command manifest。

## 验证

- 已运行 `npx vitest run tests/unit/story-stage.test.ts tests/unit/artifact-scanner.test.ts tests/unit/get-project-status.test.ts tests/unit/validate-project.test.ts`。
- 已运行 `npm run build`。
