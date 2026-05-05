# 安装指南

## 系统要求

- **操作系统**：Windows、macOS 或 Linux
- **Node.js**：18.0.0 或更高版本
- **npm**：随 Node.js 一起安装
- **Git**：用于版本管理（可选但推荐）
- **AI 助手**：以下任选其一
  - [Claude](https://claude.ai) （推荐）
  - [Cursor](https://cursor.sh)
  - [Gemini](https://gemini.google.com)

## 安装步骤

### 1. 安装 Node.js

如果尚未安装 Node.js，请访问 [Node.js 官网](https://nodejs.org/) 下载并安装最新的 LTS 版本。

验证安装：
```bash
node --version  # 应显示 v18.0.0 或更高
npm --version   # 应显示 npm 版本号
```

### 2. 安装 StorySpec

使用 npm 全局安装：

```bash
npm install -g story-spec-cn
```

或使用 yarn：

```bash
yarn global add story-spec-cn
```

或使用 pnpm：

```bash
pnpm add -g story-spec-cn
```

### 3. 验证安装

```bash
storyspec --version
storyspec --help
```

## 初始化项目

### 创建新项目

```bash
# 创建名为"我的小说"的项目
storyspec init --workspace 我的小说

# 指定 AI 助手类型
storyspec init --workspace 我的小说 --agent claude
storyspec init --workspace 我的小说 --agent cursor
storyspec init --workspace 我的小说 --agent gemini
```

`--workspace` 会显式指定 StorySpec 工作区路径；初始化成功后，CLI 会先显示“工作区已就绪”，再引导你保存一句灵感并运行 `storyspec next` 查看素材分流入口。

### 在现有目录初始化

```bash
# 在当前目录初始化
storyspec init --here

# 指定 AI 助手
storyspec init --here --agent claude
```

旧 `--ai` 入口仍处于兼容期，但新项目建议使用 `--agent`；需要一次生成全部入口时使用 `--all-agents`。

### 不使用 Git（如果没有安装 Git）

```bash
storyspec init --workspace 我的小说 --no-git
```

## AI 助手配置

### Claude 配置

1. 访问 [Claude](https://claude.ai)
2. 登录或注册账号
3. 打开你的小说项目目录
4. 在 Claude 中使用斜杠命令

### Cursor 配置

1. 下载并安装 [Cursor](https://cursor.sh)
2. 打开 Cursor
3. 选择 `File > Open Folder` 打开项目目录
4. 在编辑器中使用斜杠命令

### Gemini 配置

1. 访问 [Gemini](https://gemini.google.com)
2. 登录 Google 账号
3. 在对话中描述项目路径
4. 使用斜杠命令进行创作

## 项目结构说明

初始化后的项目结构：

```
我的小说/
├── .specify/                    # StorySpec 配置、模板、命令和 agent 合约
│   ├── agent-contract.md        # agent 共用协作边界
│   ├── agent-guides/            # 小说创建引导协议
│   ├── commands/                # 通用 Markdown 命令入口
│   ├── memory/                  # 作者画像等长期偏好
│   ├── previews/                # 待确认的规格和计划预览
│   └── templates/               # 项目模板
├── AGENTS.md                    # agent 读取入口
├── spec/                        # world/canon/tracking/voice 等长期资料
├── stories/                     # 故事工作区
│   └── 故事名/
│       ├── idea.md              # 作者原始灵感
│       ├── clarifications.json  # 作者确认、AI 候选和待确认记录
│       ├── clarifications.md    # 给作者阅读的澄清摘要
│       ├── specification.md     # apply 后写入的故事规格
│       ├── creative-plan.md     # apply 后写入的创作计划
│       ├── tasks.md             # agent 生成的写作任务
│       ├── content/             # 正文
│       └── scenes/              # Scene Card
└── research/                    # 本地资料和 citation
```

## 环境检查

运行环境检查命令：

```bash
storyspec check
```

这会检查：
- Node.js 版本
- Git 是否安装
- AI 助手工具状态

## 常见问题

### Q: 安装时提示权限错误

**Windows PowerShell**：
```powershell
# 以管理员身份运行 PowerShell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**macOS/Linux**：
```bash
# 使用 sudo 安装
sudo npm install -g story-spec-cn
```

### Q: 提示 "command not found"

确保 npm 的全局包路径在系统 PATH 中：

```bash
# 查看 npm 全局包路径
npm config get prefix

# 将路径添加到 PATH（根据你的 shell 调整）
export PATH="$PATH:$(npm config get prefix)/bin"
```

### Q: Git 初始化失败

如果没有安装 Git 或不需要版本控制：

```bash
storyspec init --workspace 我的小说 --no-git
```

### Q: 中文目录名有问题

在某些系统上，中文目录名可能导致问题。建议使用英文或拼音：

```bash
storyspec init --workspace my-novel
# 或
storyspec init --workspace wo-de-xiao-shuo
```

### Q: AI 助手无法识别斜杠命令

1. 确保项目已正确初始化
2. 检查 `.specify/agent-contract.md` 和对应 agent 命令目录是否存在
3. 在 AI 助手中明确说明你在使用 StorySpec
4. 尝试运行 `storyspec agent:doctor` 查看入口文件是否完整
5. 如果当前工具不支持斜杠命令，读取 `.specify/commands/*.md` 并按文档手动执行

## 升级 StorySpec

```bash
# 查看当前版本
storyspec --version

# 升级到最新版本
npm update -g story-spec-cn

# 或重新安装
npm uninstall -g story-spec-cn
npm install -g story-spec-cn
```

## 卸载

```bash
npm uninstall -g story-spec-cn
```

## 获取帮助

- 📖 查看[快速入门指南](quickstart.md)
- 💬 访问 [GitHub Issues](https://github.com/WENZIZZHENG/story-spec/issues)
- 📧 联系支持：support@novelwriter.io

---

下一步：[快速入门](quickstart.md) →
