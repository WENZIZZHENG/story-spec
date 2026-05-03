---
change_type: minor
scope: cli,templates,docs,tests
---

# 分支 what-if 对照卡

## CLI 行为

- `storyspec branch:compare` 输出 what-if 对照卡，补充分支会长成什么小说、读者承诺变化、收益代价、关系线偏移和世界压力显露节奏。
- `storyspec next` 会显示活跃 exploring 分支，并给出 `storyspec branch:compare <branchId>` 下一步。
- `storyspec creative:report` 会把活跃分支作为创作方向展示，而不是只把分支留在文件目录里。

## 模板契约

- `/plan` 模板读取 `stories/*/branches/*/impact.md` 时，必须把分支视为 what-if 候选参考。
- 未经 `branch:promote --yes` 的分支不得覆盖 main 计划、正文或 canon；吸收分支时应生成后续人工迁移任务。

## 生成产物

- agent 命令产物会同步更新 `/plan` 的 what-if 分支参考说明。
- 命令 manifest 需要随模板重新生成。

## 文档

- README 和命令速查补充 branch compare 的小说风味、承诺变化和代价说明。
- 创作工作台路线图记录 F13 完成状态，并把下一步推进到 F14 创作回声与成果摘要。

## 验证

- `npm run build`
- `npm test -- tests/unit/manage-branches.test.ts tests/unit/story-onboarding.test.ts tests/unit/creative-report.test.ts`
- `npm test`
- `npm run test:smoke`
- `npm run build:commands`
- `npm run check:command-manifest`
- `npm run check:changes`
