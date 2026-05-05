# 共创体验下一轮增强复核（2026-05-05）

## 范围

- 复核对象：`tests/fixtures/co-creation/programming-casting-first-round.json`
- 相关验收：`tests/unit/co-creation-experience-acceptance.test.ts`、`tests/unit/co-creation-first-round-script.test.ts`、`tests/unit/co-creation-workbench.test.ts`
- 归档参考：`docs/tech/archive/completed-roadmaps/story-co-creation-interview-roadmap.md`、`story-co-creation-workbench-roadmap.md`、`story-co-creation-experience-roadmap.md`
- 目标：确认 F0-F21 完成后，是否仍存在值得立即转 OpenSpec 的“更有趣 / 更低负担 / 更保护控制权”共创缺口。

## 验证记录

| 命令 | 结果 | 说明 |
| --- | --- | --- |
| `npx vitest run tests/unit/co-creation-experience-acceptance.test.ts tests/unit/co-creation-first-round-script.test.ts tests/unit/co-creation-workbench.test.ts` | 3 个测试文件、5 个测试通过 | 《编程施法》首轮共创样例通过入口自由、低负担、选择后果、创作回声、候选边界、计划门禁和回应范围验收。 |

## 当前可用能力

| 体验点 | 现状 | 用户收益 | 分流 |
| --- | --- | --- | --- |
| 多入口共创 | 首轮样例推荐 `power`、`stage`、`faction`；入口卡覆盖主角、伙伴、世界、舞台、能力、势力、冲突、场景、结尾、分支。 | 作者可以从最有兴趣的创作点开始，不被线性表单锁住。 | 关闭 |
| 有后果的候选 | 每个候选包含 `appeal`、`cost`、`relationshipImpact`、`worldImpact`、`futureHook`、`confirmationBoundary`。 | 提升乐趣：候选不是普通答案，而是能看见取舍的故事岔路。 | 关闭 |
| 低负担首轮 | 验收要求每个入口 2-3 个候选，`todayCreationModes` 也限制最多 2 个问题 / 2 个候选。 | 降低负担：避免首轮变成大表单或完整计划审稿。 | 关闭 |
| 作者回应范围 | fixture 覆盖 `confirm`、`rewrite`、`reject`、`defer`。 | 保护控制权：作者可改写和拒绝，不被迫接受 AI 候选。 | 关闭 |
| 计划门禁 | 验收明确禁止首轮直接写完整 `creative-plan.md` 或把未确认角色势力写入正典。 | 保护控制权：核心要素不足时不越过预览和确认边界。 | 关闭 |

## 候选增强清单

| 候选 | 提升方向 | 证据 | 建议 | 边界 |
| --- | --- | --- | --- | --- |
| 首轮样例只覆盖《编程施法》 | 提升乐趣、降低回归盲区 | 当前自动验收 fixture 只有一个题材样例；它覆盖能力、舞台、势力，对无金手指、纯关系或悬疑样例覆盖不足。 | P2 保留。若后续共创改动较大，可新增一个“非能力驱动”的 fixture，例如关系悬疑或群像故事，用同一验收函数防止单题材过拟合。 | 不在本轮新增 fixture；没有复现退化前不扩大测试维护面。 |
| 入口卡很多，普通输出仍可能偏密 | 降低负担 | `next --json` 信息完整；普通 `--modes` 已足够轻，但完整入口卡仍包含大量字段。 | P2 保留。若真实首程反馈显示“入口太多”，再设计默认只展示 3 个推荐入口、其余放 `--verbose` 的 OpenSpec。 | 不削弱现有 `--verbose` 和 JSON 自动化信息，不删除入口卡字段。 |

## 本轮结论

- 当前共创体验基线可用，且已有自动验收防止“重计划优先”“候选无后果”“候选写成正典”等退化。
- 没有发现 P0/P1 缺陷；不创建实现 OpenSpec。
- 下一步进入 P2-2：复核长文、表格、核心要素缺口和 `core` 面板解释。
