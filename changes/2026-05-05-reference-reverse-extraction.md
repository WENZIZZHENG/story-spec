---
change_type: minor
scope: cli,application,commands,docs,tests,openspec,todo
---

# 参考作品反向拆解

## CLI 行为

- 新增 `storyspec reference:reverse [story]` preview-only CLI。
- 命令从 `--text` 或 `--file` 读取作者提供的参考作品读后笔记、摘要或本地资料，支持 `--title` 和 `--json`。
- 输出“原作依赖项 / 高风险相似项 / 可原创化结构 / 新故事候选 / 不得直接照搬清单”，默认不写入 world、canon、specification 或正文。

## 模板契约

- 新增 `/reference-reverse` agent command 模板，要求只处理作者提供资料，不联网抓取、不下载原作、不解析整本小说。
- agent 输出必须保持 candidate / preview 口径，进入正典前仍需 preview / confirm / apply。
- 命令明确禁止生成未授权原作续写正文，禁止把参考作品专名、剧情线或原文表达写入原创项目。

## 生成产物

- `npm run build:commands` 会把 reference reverse agent command 同步到各 agent command 产物。
- 命令产物 manifest 随新增 command 更新。
- README 只记录真实可用的 preview-only 能力，不承诺自动续写或全文拆书。

## 验证

- `openspec validate add-reference-reverse-extraction --strict --json --no-interactive`
- `npx vitest run tests/unit/reverse-reference.test.ts tests/unit/build-commands.test.ts`
- `npx vitest run tests/smoke/reference-reverse-cli.test.ts`
- `npm run build`
- `npm run build:commands`
- `npm run check:command-manifest`
- `npm run check:changes`
- `git diff --check`

## 边界

- 不抓取、下载或复述参考作品全文。
- 不自动判断法律结论，只提供创作边界和候选分区。
- 不提供 `--apply` 写入；第一版只做 preview。
