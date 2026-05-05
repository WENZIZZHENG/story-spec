---
change_type: patch
scope: cli,templates,docs,tests,openspec
---

# 升级保留继续创作入口

## CLI 行为

- `storyspec upgrade --templates` 现在会保留项目根目录已存在的 `CONTINUE.md`。
- `.specify/templates/CONTINUE.md` 和 `.specify/templates/authoring/*` 仍会随模板升级刷新。
- 如果根目录 `CONTINUE.md` 缺失，升级仍会从模板安装通用继续创作入口。
- 保留现有入口时，升级流程会输出提示，说明故事级 `CONTINUE.md` 已保留。

## 背景

- `法术编译纪元` dogfood 复现到：通用模板覆盖根 `CONTINUE.md` 后，项目仍能通过验证，但作者需要额外寻找 story dashboard 才能恢复“下一章从哪里接”的上下文。
- 该文件在真实故事项目中是断点入口，不应被当成普通模板覆盖。

## 模板契约

- 根目录 `CONTINUE.md` 属于项目级断点入口，允许作者或 agent 写入故事级下一步、当前章节边界和验证提示。
- `.specify/templates/CONTINUE.md` 属于通用模板源，可以随 `upgrade --templates` 刷新。
- 升级不得把通用模板静默覆盖到已存在的故事级根入口。

## 生成产物

- 已有项目运行 `storyspec upgrade --templates` 后，根目录 `CONTINUE.md` 保持原内容。
- `.specify/templates/CONTINUE.md` 继续获得最新通用入口模板。
- 新增或缺失根 `CONTINUE.md` 的项目仍能通过升级获得通用入口。

## 验证

- `openspec validate preserve-continuation-entry-on-upgrade --strict --json --no-interactive`
- `npx vitest run tests/unit/upgrade-project.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
