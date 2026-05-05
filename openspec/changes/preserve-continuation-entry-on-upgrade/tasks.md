## T. TDD 修复

- [x] T.1 新增 `upgradeProject` 回归测试：项目根 `CONTINUE.md` 已含故事级下一步时，`upgrade --templates` 不覆盖它；同时 `.specify/templates/CONTINUE.md` 仍刷新为核心模板。
- [x] T.2 运行目标测试并确认先失败，失败原因是当前实现覆盖根 `CONTINUE.md`。
- [x] T.3 修改升级逻辑：`CONTINUE.md` 不存在才安装核心模板，存在时保留并发出 info 事件。
- [x] T.4 运行目标测试确认通过。

## D. 记录与同步

- [x] D.1 新增 dogfood 记录，写明复现项目、命令、验证输出摘要、摩擦和本 change。
- [x] D.2 更新 `docs/tech/experience-followup-roadmap.md` 的 P0-0 状态，说明已形成 dogfood 记录并转入实现修复。
- [x] D.3 新增 changeset，说明升级保护 `CONTINUE.md` 的真实行为和边界。

## V. 验证

- [x] V.1 运行 `openspec validate preserve-continuation-entry-on-upgrade --strict --json --no-interactive`。
- [x] V.2 运行 `npx vitest run tests/unit/upgrade-project.test.ts`。
- [x] V.3 运行 `npm run build`、`npm run check:changes`、`git diff --check`。
- [x] V.4 确认没有把 `D:/project/CherryStudio_codex/法术编译纪元/**` 的 dogfood 变更纳入本仓库提交。
