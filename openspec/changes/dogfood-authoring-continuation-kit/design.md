## Context

StorySpec 现有项目初始化会复制 `templates/` 到 `.specify/templates/`，复制 `scripts/` 到 `.specify/scripts/`，并把 `templates/tracking`、`templates/knowledge` 等写入用户项目数据区。升级流程已有对应的 `templates`、`scripts`、`spec` 更新开关，且明确保护 `spec/tracking` 与 `spec/knowledge`。

`法术编译纪元` dogfood 中新增的 `CONTINUE.md`、`story-dashboard.md`、`open-promises.md`、`tracking-update-checklist.md` 和本地验证脚本解决的是“作者从断点继续创作”的导航问题。它们不能作为正典来源，也不能把实例故事的角色、世界观、章节进度写回源模板。

## Goals / Non-Goals

**Goals:**

- 给新项目提供根目录继续创作入口 `CONTINUE.md`，指向 `storyspec status`、`storyspec handoff`、`storyspec validate` 和脚本兜底入口。
- 给 agent 和作者提供故事级工具包模板：故事面板、开放承诺面板、追踪回填清单、章节卡模板。
- 给用户项目提供跨平台本地验证脚本入口，优先调用正式 `storyspec validate`，在 CLI 不可用时至少检查关键 Markdown 与 JSON 结构。
- 让 `storyspec validate` 能发现继续创作工具包缺失，并用 warning 引导旧项目运行 upgrade。
- 保持初始化和升级的用户数据边界，不覆盖 `stories/*`、`spec/tracking`、`spec/knowledge`。

**Non-Goals:**

- 不复制 `法术编译纪元` 的正文、人物档案、世界设定或 tracking 事实。
- 不新增浏览器工作台、静态 HTML 生成器或交互图谱。
- 不新增外部依赖。
- 不改变现有 preview / apply 正典确认门禁。
- 不手工编辑 `dist/` 产物。

## Decisions

1. **根目录 `CONTINUE.md` 作为作者入口，故事级文件作为模板而非默认故事数据。**  
   初始化时直接写入通用 `CONTINUE.md`，因为它是项目级导航，不包含正典事实。故事级 `story-dashboard.md`、`open-promises.md`、`tracking-update-checklist.md` 和 `chapter-template.md` 放在 `.specify/templates/authoring/`，由 agent 在具体故事上下文中复制和改写。备选方案是在 `stories/<name>/` 自动生成这些文件，但新项目可能还没有故事，且自动写故事目录容易制造伪正典。

2. **本地验证脚本优先委托正式 CLI，兜底只做轻量结构检查。**  
   `scripts/powershell/validate-local.ps1` 与 `scripts/bash/validate-local.sh` 会先寻找 `storyspec validate` 或本项目 `dist/script-runtime.js validate-local`，兜底逻辑只检查关键文件、JSON 可解析和未完成任务提示。备选方案是把实例中的 PowerShell 检查原样复制，但它硬编码了故事名和章节，不能通用。

3. **把通用检查放入 `script-runtime.ts`，脚本只做薄包装。**  
   这样初始化项目获得的 `.specify/scripts/*/validate-local.*` 可以在没有全局 storyspec 命令时运行同一份 TypeScript 构建产物，避免 PowerShell/Bash 两套逻辑漂移。源文件是 `src/script-runtime.ts` 和 `src/application/*`；`dist/` 仍由 `npm run build` 生成。

4. **验证缺失工具包用 warning，不阻断旧项目。**  
   对 `CONTINUE.md`、`.specify/templates/authoring/*` 和 `.specify/scripts/*/validate-local.*` 的缺失使用 warning。这样旧项目可以先继续写作，再按需要运行 `storyspec upgrade --templates --scripts` 补齐。备选方案是 error，但会把非正文能力变成硬阻断。

5. **技术路线只登记未实现的后续增强。**  
   Markdown + Mermaid、静态 HTML、交互图谱等来自 dogfood 的建议进入 `docs/tech/experience-followup-roadmap.md` 或新子路线，不写入 README 的可用能力。已落地能力通过 `changes/*.md` 记录。

## Risks / Trade-offs

- [模板过泛导致作者不知道如何落地] → 模板内给出“复制到故事目录后填写”的明确步骤，并用占位符提示“作者已确认 / 正文已发生 / 待确认”边界。
- [验证脚本和 CLI validate 重复] → 本地脚本默认先调用正式 CLI；兜底只处理 CLI 不可用的最低检查。
- [旧项目升级覆盖用户文件] → 只更新 `.specify/templates` 和 `.specify/scripts`；不写 `stories/*` 与用户 tracking/knowledge。
- [缺失工具包 warning 增加噪音] → warning 文案必须带明确修复命令，并保持 `result.valid` 不因 warning 变 false。

## Migration Plan

先新增模板和脚本测试，确认初始化和升级会复制工具包；再实现模板、脚本运行时和验证 warning；随后更新技术待办、changes 记录和文档。回滚时删除新增模板、脚本入口和验证 warning，不影响用户项目正典数据。

## Open Questions

- 后续是否需要一个正式 CLI 命令从 `.specify/templates/authoring/` 生成某个故事的 `story-dashboard.md` 与 `open-promises.md`，本次先不实现。
- Mermaid 图示是否进入默认模板，还是作为 P2 体验增强按故事规模再启用，本次先保留在路线图中。
