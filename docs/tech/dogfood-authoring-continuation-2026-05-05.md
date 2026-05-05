# 继续创作工具包 Dogfood 记录（2026-05-05）

## 项目

- 项目：`D:/project/CherryStudio_codex/法术编译纪元`
- 故事：`法术编译纪元`
- 当前入口文件：根目录 `CONTINUE.md`、`stories/法术编译纪元/story-dashboard.md`
- 目标：验证升级后的继续创作工具包是否能降低断点续写成本。

## 执行记录

| 步骤 | 命令或文件 | 结果 |
| --- | --- | --- |
| 升级预览 | `node D:/project/CherryStudio_codex/story-spec/dist/cli.js upgrade --templates --scripts --dry-run --yes` | 预览将更新 36 个脚本和 86 个模板，不涉及 `stories/*` 正文 |
| 实际升级 | `node D:/project/CherryStudio_codex/story-spec/dist/cli.js upgrade --templates --scripts --yes --no-backup` | 成功更新脚本和模板 |
| 正式验证 | `node D:/project/CherryStudio_codex/story-spec/dist/cli.js validate --json` | `valid: true`，error/warning/info 均为 0 |
| 本地验证 | `powershell -ExecutionPolicy Bypass -File scripts/validate-local.ps1` | 39 项通过，`Validation passed.` |

## 观察

- `stories/法术编译纪元/story-dashboard.md` 能直接指出下一步：第四章章节卡、地下洞网检测和临时排水方案。
- 原有根目录 `CONTINUE.md` 也能直接给出可复制续写指令和当前章节边界。
- 升级后，根目录 `CONTINUE.md` 被通用模板覆盖，仍可导航到 `status`、`handoff` 和验证，但丢失了故事级“第四章从哪里接”的高价值上下文。
- 自动验证没有捕获该体验退化，因为文件仍存在且结构合法。

## 摩擦判定

| 维度 | 结论 |
| --- | --- |
| 能否只读 `CONTINUE.md` 进入下一章 | 升级前可以；升级后需要再找 story-dashboard 或 handoff |
| 是否阻断继续写作 | 不阻断，但增加断点恢复成本 |
| 是否可复现 | 是，`upgrade --templates` 会覆盖已存在的根 `CONTINUE.md` |
| 是否转 OpenSpec | 是，转入 `openspec/changes/preserve-continuation-entry-on-upgrade` |

## 建议

- `storyspec upgrade --templates` 应刷新 `.specify/templates/CONTINUE.md` 和 `.specify/templates/authoring/*`。
- 如果项目根 `CONTINUE.md` 已存在，应保留它并提示“故事级入口已保留”。
- 如果项目根 `CONTINUE.md` 缺失，升级仍应安装通用入口。
