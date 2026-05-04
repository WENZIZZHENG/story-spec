# scoped-context-pack Specification

## ADDED Requirements

### Requirement: context pack 必须支持任务范围

`context:pack` SHALL 支持按写作任务生成最小上下文包。

#### Scenario: 按 task 生成单章上下文

- GIVEN 存在写作任务 `T004`
- WHEN 用户或 agent 请求生成 `T004` 的 context pack
- THEN context pack SHALL 包含当前任务说明、验收要求、allowed writes、required reads 和相关 Scene Card
- AND SHALL 包含与该任务直接相关的角色、关系、伏笔、张力或正典摘要
- AND SHALL NOT 默认打包整卷所有资料

#### Scenario: task id 不存在

- GIVEN 用户请求不存在的任务 id
- WHEN 生成 context pack
- THEN 命令 SHALL 失败或返回 warning 状态
- AND SHALL 给出可用任务或修正建议
- AND SHALL NOT 退化为无边界全项目扫描

### Requirement: context pack 必须支持章节范围

`context:pack` SHALL 支持按章节编号或章节路径生成最小上下文包。

#### Scenario: 按 chapter 生成上下文

- GIVEN 当前故事有第一卷第 2 章任务或 Scene Card
- WHEN 用户请求第 2 章 context pack
- THEN context pack SHALL 包含第 2 章写作所需最小资料
- AND SHOULD 包含上一章摘要或前情承接
- AND SHOULD 包含下一章的非剧透约束或收尾提醒

#### Scenario: chapter 与多个任务匹配

- GIVEN 同一章节存在草稿、修订和收尾多个任务
- WHEN 用户请求按章节生成 context pack
- THEN 输出 SHALL 标明匹配到的任务列表
- AND SHALL 要求用户或 agent 选择具体 task，或按可验证规则选择当前 active task

### Requirement: context pack 必须声明 included 与 omitted

生成的上下文包 SHALL 显式声明包含了哪些来源、排除了哪些大型或无关来源，以及排除原因。

#### Scenario: 成功生成最小上下文包

- GIVEN context pack 成功生成
- WHEN 用户查看 pack 摘要或 JSON
- THEN 输出 SHALL 包含 included sources
- AND SHALL 包含 omitted sources 或 scope boundary
- AND SHALL 包含 warnings 和 next recommended reads

#### Scenario: 必要资料缺失

- GIVEN 当前章节缺少 Scene Card 或上一章摘要
- WHEN context pack 生成
- THEN 输出 SHALL 标明缺失资料
- AND SHALL 保留可用资料的最小包
- AND SHALL 给出创建或补齐缺失资料的 next action

### Requirement: context pack 输出必须可被 agent 复用

context pack SHALL 提供稳定的机器可读输出，使 agent 不必解析中文文本来恢复写作上下文。

#### Scenario: JSON 输出

- GIVEN 用户请求 JSON 输出
- WHEN context pack 生成
- THEN JSON SHALL 包含 scope type、scope id、included artifacts、omitted artifacts、warnings、allowed writes、next actions
- AND artifact path SHALL 使用 story-relative 或明确标注的绝对路径格式
