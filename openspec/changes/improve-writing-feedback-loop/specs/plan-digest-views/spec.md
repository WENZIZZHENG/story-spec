# plan-digest-views Specification

## ADDED Requirements

### Requirement: 卷计划必须提供一屏摘要

计划预览或创作报告 SHALL 能输出一屏内的卷计划摘要。

#### Scenario: 卷计划资料完整

- GIVEN 第一卷计划包含三幕结构、章节节奏、角色弧线和关系变化
- WHEN 用户查看计划摘要
- THEN 摘要 SHALL 包含第一卷一句话目标
- AND SHALL 包含三幕结构摘要
- AND SHALL 包含 12 章节奏或章节功能表
- AND SHALL 包含核心角色弧线、剧情起伏和人物关系概况

#### Scenario: 卷计划资料不足

- GIVEN 卷计划缺少角色弧线或人物关系资料
- WHEN 用户查看计划摘要
- THEN 摘要 SHALL 标明对应区块资料不足或待确认
- AND SHALL NOT 自动补完缺失事实
- AND SHALL 给出补齐该区块的 next action

### Requirement: 摘要视图必须保留确认状态

计划摘要 SHALL 区分 confirmed、candidate、missing 或 needs-confirmation 信息。

#### Scenario: 摘要包含候选关系

- GIVEN 人物关系来自未确认 AI 候选
- WHEN 摘要展示该人物关系
- THEN 摘要 SHALL 标明该关系为 candidate 或待确认
- AND SHALL NOT 将其写成已确认正典

#### Scenario: 摘要包含 evidence 缺口

- GIVEN 某个角色弧线缺少来源或 evidence
- WHEN 摘要展示该角色弧线
- THEN 摘要 SHALL 标明 evidence 缺口
- AND SHALL 给出需要作者确认或补资料的提示

### Requirement: 后续视图必须支持 Markdown 与 Mermaid

系统 SHALL 支持输出 Markdown 表格和 Mermaid 文本形式的关系图、张力表、角色弧线表。

#### Scenario: 输出人物关系图

- GIVEN 故事存在主要角色和关系 tracking
- WHEN 用户请求关系图视图
- THEN 输出 SHALL 包含可复制的 Mermaid graph 或 flowchart 文本
- AND SHALL 标明关系状态、冲突或阵营信息
- AND SHALL 对资料不足的边或节点标记待确认

#### Scenario: 输出剧情起伏表

- GIVEN 故事存在章节计划或张力 tracking
- WHEN 用户请求剧情起伏视图
- THEN 输出 SHALL 包含 Markdown 表格
- AND 表格 SHALL 至少展示章节、张力或冲突、情感推进、伏笔/回收状态

#### Scenario: 输出角色弧线表

- GIVEN 故事存在角色目标、转折和卷末状态
- WHEN 用户请求角色弧线视图
- THEN 输出 SHALL 包含 Markdown 表格
- AND 表格 SHALL 展示起点、关键转折、阶段性选择和当前或卷末状态

### Requirement: 视图不得替代正典写入流程

摘要和可视化视图 SHALL 只作为读取与反馈视图，不得绕过 preview / confirm / apply。

#### Scenario: 用户查看摘要后接受候选设定

- GIVEN 摘要展示了候选角色关系
- WHEN 用户想把该关系确认为正典
- THEN 系统 SHALL 走现有确认或 apply 流程
- AND SHALL NOT 仅因视图展示就静默写入正典
