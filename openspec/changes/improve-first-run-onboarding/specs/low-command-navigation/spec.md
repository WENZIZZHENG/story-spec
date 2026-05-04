# low-command-navigation Spec

## ADDED Requirements

### Requirement: 新手导航首屏必须少命令化

面向空项目、新故事或首程状态的导航输出 SHALL 优先展示自然语言入口，再展示可复制命令。

#### Scenario: 空项目请求下一步

- Given 当前 StorySpec 工作区没有可执行的故事首程状态
- When 用户请求下一步
- Then 系统 SHALL 在首屏展示 3 到 5 个作者可理解的自然语言入口
- And 入口 SHALL 覆盖长文资料、一句灵感、随便聊聊和表格资料中的适用项
- And copyable command SHALL 位于次级区域或每个入口的辅助信息中
- And 系统 SHALL NOT 只输出命令列表

#### Scenario: 用户已经表达素材状态

- Given 用户已经说出自己有长文资料、一句灵感、表格资料或只想聊聊
- When 系统生成下一步建议
- Then 系统 SHALL 直接推进对应入口
- And 系统 SHALL NOT 再要求用户从完整命令菜单中选择

### Requirement: 自然语言入口必须映射到明确动作

每个自然语言入口 SHALL 有明确 action 和可复制命令，以便高级用户、agent 和 UI 使用。

#### Scenario: 人类文本输出导航入口

- Given 系统展示自然语言入口
- When 用户查看入口说明
- Then 每个入口 SHALL 包含下一步会发生什么
- And 每个入口 SHOULD 提供对应 copyable command
- And 命令说明 SHALL 不抢占入口本身的可读性

#### Scenario: JSON 输出导航入口

- Given 用户以 JSON 模式请求导航
- When 系统返回入口列表
- Then 每个入口 SHALL 包含稳定 id 或 action
- And 每个入口 SHALL 包含 label、description 和 recommendedCommand 或等价字段
- And agent/UI SHALL 能在不解析人类中文文案的情况下执行下一步

### Requirement: 高级命令能力必须保留

少命令化导航 SHALL 改变默认呈现方式，但 SHALL NOT 删除、重命名或弱化现有高级命令入口。

#### Scenario: 高级用户直接运行命令

- Given 用户直接运行 `story:new`、`ingest`、`co:create`、`next` 或 preview/apply 相关命令
- When 命令参数完整且当前工作区有效
- Then 系统 SHALL 执行对应命令
- And 系统 SHALL NOT 强制用户经过自然语言菜单

### Requirement: 导航不得自动确认候选

导航可以推荐下一步或生成 preview，但 SHALL NOT 将任何候选内容自动确认。

#### Scenario: 用户从入口进入导入或共创

- Given 用户通过自然语言入口进入素材导入或共创
- When 系统生成候选设定或下一步建议
- Then 系统 SHALL 明确区分已确认、候选和待确认
- And 系统 SHALL 要求用户确认后才能 apply
- And 系统 SHALL NOT 因用户选择入口而默认确认候选

### Requirement: 首程文案必须与 agent guide 保持一致

CLI、agent prompt 和用户文档中的首次路径 SHALL 使用同一套入口语义，避免作者在不同 agent 中看到冲突指引。

#### Scenario: 用户通过 agent 而非 CLI 开始

- Given 用户在 Codex、Claude、Gemini 或通用 Markdown agent 中询问如何开始 StorySpec
- When agent 应用 StorySpec 小说创建引导协议
- Then agent SHALL 先确认工作区状态
- And agent SHALL 使用与 CLI 首屏一致的素材入口
- And agent SHALL 不先讲安装、命令和文件结构，除非用户明确询问
