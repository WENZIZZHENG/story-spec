---
change_type: minor
scope: templates,commands,docs,tests,openspec,todo
---

# 写中沉浸原则

## CLI 行为

- 不新增 `storyspec chapter:preflight` 或其他 CLI。
- `/write` 和 Scene Card 的 agent prompt 继续要求正文前输出章节前置约束卡，并等待作者确认后再进入 beat 预览和正文。
- 正文阶段新增“写中沉浸原则”：约束卡用于写前确认和写后自检，不作为正文生成时逐句审查器。

## 模板契约

- 章节卡模板新增“写中沉浸原则”区块，明确正文阶段优先身体感、感官、动作、当下反应和句子质感。
- `/write`、Scene Card、继续创作入口和 agent 小说创建指南同步三阶段姿态：写前确认约束、写中沉浸起草、写后对照自检。
- 写后收尾仍必须回到约束卡检查情感反应顺序、能力规则、语言水平、人物反应和世界观一致性。

## 生成产物

- `npm run build:commands` 会把写中沉浸原则同步到各 agent command 产物。
- 命令产物 manifest 随模板变更更新。
- README 不新增尚未实现的独立功能承诺。

## 验证

- `openspec validate add-immersive-drafting-principle --strict --json --no-interactive`
- `npx vitest run tests/unit/authoring-templates.test.ts tests/unit/build-commands.test.ts`
- `npm run build`
- `npm run build:commands`
- `npm run check:command-manifest`
- `npm run check:changes`
- `git diff --check`

## 边界

- 不取消章节前置约束卡。
- 不降低 preview / confirm / apply 或作者确认门禁。
- 不自动评价文学上限，不引入 LLM 评分或外部写作审查工具。
