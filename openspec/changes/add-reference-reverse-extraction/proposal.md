## Why

作者经常会喜欢一部参考小说的世界运行逻辑、爽点结构、关系张力或未完成承诺，但原作可能太监、后续情节令人不适，或作者希望把喜欢的结构转成自己的新故事。StorySpec 已有本地 research、ingest、preview/apply 和候选/确认边界，但缺少一个明确入口，把“喜欢什么、讨厌什么、想修复什么”拆成原创设计输入。

本变更提供一个克制的反向拆解流程：只处理作者提供的摘要、读后笔记或本地文件，不抓取原文、不联网、不解析整本小说；输出结构化 preview，默认不写入 world/canon/spec。

## What Changes

- 新增 preview-only CLI：`storyspec reference:reverse`。
- 新增应用层反向拆解服务，输出“原作依赖项”“高风险相似项”“可原创化结构”“新故事候选”“不得直接照搬清单”等分区。
- 新增 agent command 模板，指导 agent 以候选方式做精神内核提取和原创化转译。
- 更新 README、changeset、待办归档和命令产物。

## Capabilities

### Added Capabilities

- `reference-reverse-extraction`: 从作者提供的参考作品笔记中提取原创化候选，不默认写入正典。

## Impact

影响范围包括 `src/application/`、`src/cli/commands/`、`src/cli/program.ts`、`templates/commands/`、`README.md`、相关 unit/smoke 测试、命令生成产物 manifest、changeset、技术待办和归档。不新增网络抓取，不引入运行时依赖。
