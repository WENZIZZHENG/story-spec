# 共创体验验收清单

## 状态

Active。本文是 F20 的落地清单，用来检查 StorySpec 是否仍然帮助作者享受创造小说世界，而不是只检查命令、schema 和文件是否存在。

## 自动验收

自动验收由 `evaluateCoCreationExperience` 和 `tests/unit/co-creation-experience-acceptance.test.ts` 覆盖，当前接入《编程施法》首轮共创脚本。

- `entry-freedom`：作者能从能力、舞台、势力等核心入口开始。
- `low-burden-round`：每轮突出少量高价值候选，避免首轮变成重表单。
- `interesting-choice-consequences`：高影响选择展示吸引力、代价、关系影响、世界影响、后续钩子和确认边界。
- `creation-echo`：系统能说清作者刚刚创造了什么，以及仍可探索什么。
- `candidate-boundary`：候选、确认、正典和未决项边界清楚。
- `plan-gate`：核心要素不足时不会直接生成完整 `creative-plan.md`。
- `author-response-range`：作者可以确认、改写、拒绝或稍后决定。

## 人工走查

自动测试只能防止明显退化。每个共创体验相关 batch 完成时，还应人工回答：

- 这次改动是否让作者更像在创造小说世界，而不是填写系统字段？
- 作者是否看到有趣岔路，而不是只看到短答案列表？
- 哪些候选仍必须由作者确认？
- 是否让流程更重？如果更重，如何减负？
- 借鉴了哪些项目的结构？哪些没有照搬？

## 边界

- 本清单不评价作者创意质量，也不评价小说好坏。
- 本清单检查 StorySpec 的共创体验、确认边界和阶段门禁。
- 不要求所有故事路径完全一致；只要求系统保留作者控制权、选择后果和继续创作的动力。
