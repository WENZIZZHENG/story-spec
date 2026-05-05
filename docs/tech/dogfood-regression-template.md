# Dogfood 回归记录模板

## 状态

Template。用于记录 StorySpec 自用项目、真实故事项目或 fixture 走查中发现的回归和体验摩擦。本文只定义记录格式；具体问题按日期另建记录或追加到专题 dogfood 文档。

## 使用边界

- 先记录证据，再决定是否转 OpenSpec。
- P0/P1 缺陷必须带复现命令、输入样例或 fixture。
- P2/P3 体验问题先保留记录，补足用户感知和影响范围后再排期。
- 不把聊天中的猜测写成已复现问题。
- 不把某个故事的正文、设定或正典事实复制进源项目模板。

## 优先级口径

| 等级 | 口径 | 处理方式 |
| --- | --- | --- |
| P0 | 阻断继续写作、破坏作者确认边界、覆盖用户故事数据或让验证误报全绿 | 立即转 OpenSpec 修复 |
| P1 | 明显增加首程、章节生产、任务收尾或升级成本，但存在绕路 | 转 OpenSpec 或近期增强 |
| P2 | 输出过密、提示不清、需要多读文件才能理解下一步 | 先记录，积累同类证据 |
| P3 | 偏好型体验、长期探索或需要更多样本 | 保留 discovery |

## 记录字段

| 字段 | 填写要求 |
| --- | --- |
| 场景 | 例如首程、章节写作、任务收尾、validate 噪音、生成产物一致性 |
| 命令 | 精确到可复制命令；手工走查写明读取的文件 |
| 输入 | 命令参数、fixture、故事项目或最小文件片段 |
| 预期 | 用户合理期待或已确认契约 |
| 实际 | 实际输出、文件 diff 或验证结果摘要 |
| 阻断等级 | P0 / P1 / P2 / P3 |
| 复现文件 | 本地路径、fixture 或记录文档 |
| 候选路线 | 应归入哪个 roadmap、OpenSpec change 或关闭 |
| 建议验证 | 单测、smoke、手工命令或文档检查 |

## 样例记录

| 场景 | 命令 | 输入 | 预期 | 实际 | 阻断等级 | 复现文件 | 候选路线 | 建议验证 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 升级继续创作工具包 | `node D:/project/CherryStudio_codex/story-spec/dist/cli.js upgrade --templates --scripts --yes --no-backup` | `D:/project/CherryStudio_codex/法术编译纪元` 已有故事级根 `CONTINUE.md` | 升级刷新 `.specify/templates/*`，保留根 `CONTINUE.md` 中的第四章续写入口 | 旧实现覆盖根 `CONTINUE.md`，正式验证仍为 `valid: true`；已转修复并复测通过 | P1 | [dogfood-authoring-continuation-2026-05-05.md](dogfood-authoring-continuation-2026-05-05.md) | `openspec/changes/preserve-continuation-entry-on-upgrade` | `npx vitest run tests/unit/upgrade-project.test.ts`、真实项目 `upgrade --templates --scripts`、`storyspec validate --json` |

## 转 OpenSpec 检查

- 是否能稳定复现？
- 是否影响真实作者工作流，而不是只影响测试实现细节？
- 是否已有明确的期望行为或边界契约？
- 是否能用单测、smoke 或 fixture 锁住？
- 是否需要同步 changeset、路线状态或归档记录？
