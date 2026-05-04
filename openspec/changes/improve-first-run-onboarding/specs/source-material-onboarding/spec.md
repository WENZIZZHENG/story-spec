# source-material-onboarding Spec

## ADDED Requirements

### Requirement: 首程必须按素材类型提供入口

工作区就绪后，系统 SHALL 用作者可理解的素材状态分流，而不是首先要求用户选择 CLI 命令。

#### Scenario: 工作区初始化后进入素材分流

- Given StorySpec 工作区已就绪
- When 用户尚未创建故事或尚未提供核心素材
- Then 系统 SHALL 展示至少四类入口：我有长文资料、我只有一句灵感、我想先随便聊聊、我有表格资料
- And 每个入口 SHALL 说明适合的输入方式和下一步结果
- And 系统 SHALL NOT 先展示一整屏命令清单

### Requirement: 一句灵感入口必须低负担

一句灵感入口 SHALL 接受短输入，并允许在信息不完整时继续生成可修改候选。

#### Scenario: 用户只有一句灵感

- Given 用户选择一句灵感入口
- When 用户提供 20 到 200 字的灵感或更短的题材碎片
- Then 系统 SHALL 保存或预览原始灵感
- And 系统 SHALL 最多提出少量关键问题
- And 系统 SHALL 将 AI 补全标为候选或待确认
- And 系统 SHALL NOT 直接生成完整世界观、完整人物小传或长篇章节大纲作为已确认事实

### Requirement: 长文资料入口必须给出示例和推荐范围

长文资料入口 SHALL 提供可复制示例、推荐字数范围和核心要点清单。

#### Scenario: 用户准备粘贴长文资料

- Given 用户选择长文资料入口
- When 系统提示用户提供资料
- Then 系统 SHALL 建议首轮长文范围为 500 到 3000 字
- And 系统 SHALL 说明超长设定建议分段吸收
- And 系统 SHALL 提供至少一个长文资料示例
- And 系统 SHALL 提供核心要点清单，包括一句话梗概、主角、世界观、力量或规则体系、主要角色、基调、第一卷目标、禁忌或不想要的内容

#### Scenario: 用户贴入 500 字以上资料

- Given 用户提供一段长文资料
- When 系统完成吸收预览
- Then 系统 SHALL 按已识别、需要确认、仍缺少三类展示摘要
- And 系统 SHALL 解释待澄清不代表导入失败
- And 系统 SHALL 标明哪些内容来自作者明确表达，哪些内容是候选或推断

### Requirement: 表格资料入口必须解释保守导入

表格资料入口 SHALL 支持用户粘贴 Markdown 表格或表格文本，并清楚说明字段映射的不确定性。

#### Scenario: 用户提供 Markdown 表格资料

- Given 用户选择表格资料入口
- When 用户贴入 Markdown 表格
- Then 系统 SHALL 展示已识别列、未识别列和可能的字段映射
- And 系统 SHALL 将不确定映射标为候选或待确认
- And 系统 SHALL NOT 将表格内容自动确认为正典事实

### Requirement: 随便聊聊入口必须保留低负担共创契约

随便聊聊入口 SHALL 允许用户不提供完整设定，并复用低负担共创模式。

#### Scenario: 用户想先随便聊聊

- Given 用户选择随便聊聊入口
- When 系统开始共创
- Then 系统 SHALL 最多提出 2 个问题
- And 系统 SHALL 默认给出 2 个有后果的候选
- And 系统 SHALL 允许用户确认、改写、拒绝或稍后决定
- And 系统 SHALL NOT 在未确认时写入完整大纲或正典文件

### Requirement: 所有素材吸收必须遵守 preview / confirm / apply

素材 onboarding 可以生成候选、摘要和预览，但 SHALL NOT 绕过作者确认。

#### Scenario: 系统从资料中推断出设定

- Given 用户提供长文、短灵感、聊天回答或表格资料
- When 系统从中推断出未被作者明确确认的设定
- Then 推断内容 SHALL 出现在候选、待确认或 preview 区域
- And 推断内容 SHALL NOT 在未确认时写入 confirmed、canon、specification 或 creative plan 的已确认区域
