# 首程体验走查记录（2026-05-05）

## 范围

- 临时项目：`%TEMP%/storyspec-first-run-dogfood-*/workspace`
- 故事：`星尘驿站`
- 目标：走查首次创建故事、选择入口、完成一轮访谈、查看核心缺口、创作报告、规格预览和长文资料吸收。
- 结论：主路径可用，下一步命令可复制，作者控制权提示清楚；暂未发现 P0/P1 阻断缺陷。记录 1 个 P2 体验候选：`creative:report` 默认文本对首程偏长。

## 命令记录

| 路径 | 命令 | 观察 | 分流 |
| --- | --- | --- | --- |
| 初始化 | `storyspec init --workspace <temp>/workspace --agent codex --no-git` | 输出先给工作区路径，再给素材分流入口和推荐流程；适合首次复制执行 | 关闭 |
| 一句话灵感 | `storyspec story:new 星尘驿站 --idea "...驿站。" --json` | 写入 `idea.md`，JSON 含 9 步 first-run flow、下一步 `interview` 和 `next` | 关闭 |
| 默认 next | `storyspec next 星尘驿站` | 默认视图先给推荐入口、素材分流、可复制命令和缺口；信息量可接受 | 关闭 |
| 访谈 | `storyspec interview 星尘驿站 --focus stage --premise "..." --use-examples --max-questions 6 --json` | 写入澄清记录，handoff 明确 confirmed 与 ai-suggested 边界 | 关闭 |
| 核心缺口 | `storyspec core 星尘驿站 --missing` | 清楚列出成功路线、创作边界、声音、能力体系、长线威胁等缺口及下一步 | 关闭 |
| 创作报告 | `storyspec creative:report 星尘驿站` | 覆盖用户确认、骨架、卷计划、回声、关系图和核心面板；信息完整但首程默认输出偏长 | P2 体验候选 |
| 规格预览 | `storyspec preview specify 星尘驿站` | 输出 preview id、目标路径、风险数、报告路径和可复制 `apply --yes`；不覆盖正式文件 | 关闭 |
| 规格 apply dry-run | `storyspec apply <preview-id> --json` | `applied: false`、`dryRun: true`，不带 `--yes` 不写入，门禁清楚 | 关闭 |
| 长文吸收 | `storyspec ingest 星尘驿站 --text "<182 字资料>" --json` | 因输入 182 字被归类为“一句灵感”，仍保守生成候选，不写入；边界清楚 | P2 观察 |
| 低负担模式 | `storyspec next 星尘驿站 --modes` | 五种模式都带不写入文件、正典边界和回应方式；适合随便聊入口 | 关闭 |
| 验证 | `storyspec validate --json` | `valid: true`，0 error / warning / info | 关闭 |

## 问题候选

| 优先级 | 问题 | 证据 | 建议 |
| --- | --- | --- | --- |
| P2 | `creative:report` 默认文本对首程偏长，容易把“下一步确认”淹没在卷计划、Mermaid 和完整面板中 | 首程访谈后直接运行 `storyspec creative:report 星尘驿站`，输出包含用户确认、骨架、缺口、两段卷计划视图和多个大表 | 暂不转实现；若后续首程记录重复出现，可考虑 `creative:report --brief` 或在 `next` 中推荐 `core --missing` 作为首程默认回看 |
| P2 | 182 字长文资料被归入“一句灵感”，但仍能输出候选和边界 | `ingest --text` 返回 `inputProfile.id: short-idea`，候选进入势力与冲突/长线威胁 | 不阻断；后续 P1-2 四入口走查时用 500+ 字资料复核长文路径 |

## 本轮结论

- 首程主链路符合 quickstart：`story:new -> next -> interview -> core/creative:report -> preview specify -> apply`。
- 写入前门禁可观察：`preview specify` 只生成预览，`apply` 不带 `--yes` 不写入。
- 作者控制权边界可观察：`interview` handoff、`creative:report` 和 `preview specify` 均区分作者确认、AI 候选、待确认。
- 没有 P0/P1 缺陷；不创建实现 OpenSpec。

## 后续

- P1-2 继续按四类入口做更细记录：一句灵感、长文资料、表格资料、随便聊聊。
- 若 `creative:report` 首程输出过长在多轮记录中重复出现，再转 OpenSpec 设计简短默认视图。
