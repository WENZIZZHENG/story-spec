## Why

`法术编译纪元` dogfood 在 2026-05-05 复现了一个继续创作摩擦：运行 `storyspec upgrade --templates --scripts` 后，项目根目录 `CONTINUE.md` 被核心通用模板覆盖。验证仍然全绿，但作者重新打开项目时原本可直接看到的“第四章从哪里接、读哪些故事文件、当前边界是什么”被替换成泛用入口，降低了断点续写效率。

根目录 `CONTINUE.md` 是故事项目的断点入口，不只是可覆盖模板。升级应刷新 `.specify/templates/CONTINUE.md` 和 `.specify/templates/authoring/*`，但必须保留作者或项目已经定制过的根 `CONTINUE.md`。

## What Changes

- 调整 `storyspec upgrade --templates`：只在根 `CONTINUE.md` 缺失时安装通用入口；已存在时保留原文件并发出提示。
- 保持 `.specify/templates/CONTINUE.md`、`.specify/templates/authoring/*` 继续随模板升级刷新。
- 新增回归测试，锁定升级不会覆盖故事级继续创作入口。
- 新增 dogfood 记录，说明复现项目、命令、摩擦、验证结果和转入的 OpenSpec change。

## Capabilities

### Modified Capabilities

- `authoring-continuation-kit`: 模板升级刷新工具包源模板，但保护项目根 `CONTINUE.md` 的故事级内容。

## Impact

影响范围包括 `src/application/upgrade-project.ts`、`tests/unit/upgrade-project.test.ts`、`docs/tech/experience-followup-roadmap.md`、`docs/tech/dogfood-authoring-continuation-2026-05-05.md` 和 changeset。该变更不修改实例项目故事数据，不新增 CLI 参数，不改变 `storyspec init` 首次安装 `CONTINUE.md` 的行为。
