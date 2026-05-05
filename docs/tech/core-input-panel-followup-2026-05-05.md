# 共创输入与核心信息面板复核（2026-05-05）

## 范围

- 临时项目：`%TEMP%/storyspec-core-input-dogfood-*/workspace`
- 样例故事：`短灵感核验`、`长文核验`、`表格核验`、`无标题核验`
- 目标：复核短灵感、长文、Markdown 表格、无标题资料在 `ingest`、`co:create`、`core --missing --json` 中的识别、来源状态、面板解释和 preview 写入边界。

## 验证记录

| 命令 | 结果 | 说明 |
| --- | --- | --- |
| `npx vitest run tests/unit/ingest-story-input.test.ts tests/unit/story-core-summary.test.ts tests/unit/co-create-workbench.test.ts` | 3 个测试文件、10 个测试通过 | 覆盖长文预览、confirmed 写入门禁、无标题候选、短灵感提示、表格候选映射、核心面板只读和 `co:create`。 |

## 输入样例与命令摘要

| 样例 | 命令 | 当前可用 | 缺口 / 观察 | 分流 |
| --- | --- | --- | --- | --- |
| 短灵感 | `storyspec ingest 短灵感核验 --text "<30 字灵感>" --json`、`storyspec core 短灵感核验 --missing --json` | `inputProfile.id: short-idea`，候选进入核心创意、舞台、能力、势力；`written: false`；核心面板只显示创作边界和核心创意缺失。 | 现状符合低负担入口；候选不会被 core 当作 partial，因为没有写入澄清记录。 | 关闭 |
| 带字段标签资料 | `storyspec ingest 长文核验 --file long-core-notes.md --json`、`storyspec co:create 长文核验 --file long-core-notes.md --apply-confirmed --json`、`storyspec core 长文核验 --missing --json` | 识别 `核心创意`、`主角`、`能力体系`、`第一舞台`、`核心伙伴`、`创作边界` 为 confirmed；`co:create --apply-confirmed` 写入 6 个 answer；core 面板将核心创意、舞台、伙伴、能力、边界标为作者确认，并继续提示成功路线、声音、势力、长线威胁和主角 partial。 | 399 字资料按长度仍显示 `short-idea`，但实际已经识别出多项字段。标签和处理结果之间有轻微认知落差。 | P2 文案 / 阈值观察 |
| Markdown 表格 | `storyspec ingest 表格核验 --file table-core-notes.md --json`、`storyspec co:create 表格核验 --file table-core-notes.md --json`、`storyspec core 表格核验 --missing --json` | `inputProfile.id: table-material`；识别 `角色`、`定位`、`关系备注`，保留 `未识别列`；列映射为 candidate；`written: false`；core 仍提示缺少创作边界和核心创意。 | 表格候选不会进入 core 面板，因此用户必须回看 ingest 输出才能看见候选映射。 | P2 可观测性观察 |
| 无标题资料 | `storyspec ingest 无标题核验 --file untitled-core-notes.md --apply-confirmed --json`、`storyspec co:create 无标题核验 --file untitled-core-notes.md --apply-confirmed --json`、`storyspec core 无标题核验 --missing --json` | 无明确字段标签时，即使加 `--apply-confirmed` 也不写入；候选覆盖主角、伙伴、舞台、能力、势力、长线威胁和边界；core 仍只显示缺少正式澄清记录。 | 控制权边界正确，但 `co:create` 的 core 区域不会概括“本轮有候选但未写入”。 | P2 可观测性观察 |

## 候选增强清单

| 候选 | 用户收益 | 涉及模块 | 验收方式 | 边界 |
| --- | --- | --- | --- | --- |
| 300-500 字带字段标签资料的素材类型提示更精确 | 降低困惑：用户看到“短灵感”时，不会误以为字段识别失败。 | `src/application/ingest-story-input.ts`、`src/domain/story-input-profile.ts` 或等价 profile 逻辑 | 新增 fixture：399 字带字段标签资料仍显示“结构化短资料”或在 guidance 中说明“短资料也可识别字段”。 | 不改变 confirmed 写入门禁，不把无标签资料自动确认。 |
| `co:create` 核心面板提示“本轮候选未写入” | 提升可观测性：用户在同一工作台里知道表格/无标题资料有候选，但 core 仍未吸收。 | `src/application/co-create-workbench.ts`、`src/application/story-core-summary.ts` | 表格或无标题 `co:create --json` / 渲染输出包含候选摘要或下一步确认命令；core 仍不把候选算 confirmed。 | 不把 candidateItems 写入 clarifications；不降低 preview / confirm / apply 边界。 |
| 表格行摘要预览 | 提升反馈感：表格资料除了列映射，还能给只读行摘要。 | `src/application/ingest-story-input.ts`、表格分析渲染 | Markdown 表格输出 `rowSummaries` 或渲染“候选人物/关系摘要”，并保持 `written: false`。 | 不把未识别列当正典，不自动创建人物卡。 |

## 本轮结论

- 输入识别和写入边界整体可用：明确字段标签才可经 `--apply-confirmed` 写入；表格与无标题资料保持候选，不污染正典。
- 核心面板能区分 confirmed / partial / missing，并对已写入长文资料给出继续共创缺口。
- 没有 P0/P1 缺陷；不创建实现 OpenSpec。
- 保留 3 个 P2 候选，后续只有在真实用户走查重复出现理解成本时再转实现。
