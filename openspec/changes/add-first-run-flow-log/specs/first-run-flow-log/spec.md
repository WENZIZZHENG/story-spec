# first-run-flow-log Spec

## ADDED Requirements

### Requirement: 首程命令必须提供流程日志

`story:new` 和 `next` SHALL 输出首程流程日志，说明当前步骤、已生成或将生成的产物、推荐下一步。

#### Scenario: 新建故事后查看流程日志

- GIVEN 用户在 StorySpec 工作区运行 `storyspec story:new <story> --idea "..."`
- WHEN 命令执行成功
- THEN 人类输出 SHALL 包含 `[流程]`、`[产物]`、`[下一步]`
- AND JSON 输出 SHALL 包含 `firstRunFlow.currentStepId`
- AND `firstRunFlow.progressLog` SHALL 至少包含 `flow`、`artifact`、`next` 三类日志

#### Scenario: idea 阶段请求下一步

- GIVEN 故事只有 `idea.md`
- WHEN 用户运行 `storyspec next <story>`
- THEN 人类输出 SHALL 显示当前处于首程流程的入口选择阶段
- AND 输出 SHALL 显示推荐下一步命令
- AND JSON 输出 SHALL 包含推荐命令，不要求 agent 解析中文文案

### Requirement: 流程日志不得越过创作确认边界

流程日志 SHALL 只描述阶段、产物和下一步，不得把候选内容标为已确认，也不得引导低信息量故事直接写正文。

#### Scenario: 低信息量故事显示下一步

- GIVEN 故事只有一句原始灵感
- WHEN 系统渲染流程日志
- THEN 下一步 SHALL 指向访谈、核心缺口或预览前置动作
- AND SHALL NOT 指向正文写作命令
- AND SHALL 提醒 preview / confirm / apply 边界仍然有效
