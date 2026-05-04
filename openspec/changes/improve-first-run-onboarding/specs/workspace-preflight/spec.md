# workspace-preflight Spec

## ADDED Requirements

### Requirement: 创作入口必须先确认 StorySpec 工作区

任何面向故事创建、素材导入、共创、下一步导航或正文写作的入口，在执行创作动作前 SHALL 判断当前上下文是否为 StorySpec 工作区。

#### Scenario: 当前目录不是 StorySpec 工作区

- Given 用户从非 StorySpec 工作区发起故事创建、素材导入、共创或下一步导航
- When 系统无法定位有效 StorySpec 项目根目录
- Then 系统 SHALL 暂停后续创作入口
- And 系统 SHALL 只要求用户提供小说工作区路径或选择当前目录初始化
- And 系统 SHALL NOT 先展示完整命令清单、故事模板或正文生成步骤

#### Scenario: 用户提供工作区路径

- Given 系统已请求工作区路径
- When 用户提供一个路径
- Then agent SHALL 直接执行初始化或等价初始化动作
- And 系统 SHALL 在初始化成功后提示工作区已就绪
- And 系统 SHALL 立即进入素材状态分流
- And 系统 SHALL NOT 要求用户手抄初始化命令才能继续

#### Scenario: 用户拒绝提供工作区路径

- Given 当前目录不是 StorySpec 工作区
- When 用户没有提供路径或明确表示暂不初始化
- Then 系统 SHALL 保持只读对话或概念说明模式
- And 系统 SHALL NOT 写入故事文件、规格文件、正典文件或 tracking 文件

### Requirement: 初始化不得猜测用户未指定路径

系统 SHALL 只在用户明确给出路径、选择当前目录或已有调用参数指定路径时初始化 StorySpec 工作区。

#### Scenario: 存在多个可能目录

- Given 当前环境中存在多个项目目录或历史工作区
- When 用户尚未指定目标小说工作区
- Then 系统 SHALL 请求用户选择或输入路径
- And 系统 SHALL NOT 根据最近目录、仓库根目录或默认文档目录自动创建工作区

### Requirement: 已有工作区必须跳过初始化请求

系统在已定位有效 StorySpec 工作区时 SHALL 继续进入素材分流或请求的创作动作，不应重复要求初始化。

#### Scenario: 当前目录已经是 StorySpec 工作区

- Given 当前目录包含有效 StorySpec 工作区标记
- When 用户请求开始创作或查看下一步
- Then 系统 SHALL 跳过工作区路径问题
- And 系统 SHALL 进入素材状态分流或执行用户明确请求的动作

### Requirement: 工作区 preflight 输出应兼容 agent 和 CLI

人类输出 SHALL 清楚说明当前缺少工作区和下一步选择；机器输出 SHALL 提供稳定 action 供 agent/UI 执行。

#### Scenario: JSON 输出非工作区状态

- Given 用户以 JSON 模式请求首程状态
- When 当前目录不是 StorySpec 工作区
- Then 输出 SHALL 包含表示需要初始化的 action
- And 输出 SHALL 包含 pathRequired 或等价机器可读字段
- And 输出 SHALL NOT 只返回需要解析的人类中文提示
