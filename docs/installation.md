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
novel --version
novel --help
```

## 初始化项目

### 创建新项目

```bash
# 创建名为"我的小说"的项目
storyspec init 我的小说

# 指定 AI 助手类型
storyspec init 我的小说 --ai claude
storyspec init 我的小说 --ai cursor
storyspec init 我的小说 --ai gemini
```

### 在现有目录初始化

```bash
# 在当前目录初始化
storyspec init --here

# 指定 AI 助手
storyspec init --here --ai claude
```

### 不使用 Git（如果没有安装 Git）

```bash
storyspec init 我的小说 --no-git
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
├── .specify/          # Spec Kit 配置目录
│   ├── config.json    # 项目配置
│   └── spec.md        # 命令规范文档
├── memory/            # 创作记忆
│   └── writing-constitution.md  # 创作风格设定
├── stories/           # 故事内容
│   └── 001-故事名/    # 具体故事目录
│       ├── story.md   # 故事大纲
│       ├── outline.md # 章节规划
│       ├── tasks.md   # 任务列表
│       └── chapters/  # 章节内容
└── scripts/           # 辅助脚本
    ├── bash/          # Unix/Linux/Mac 脚本
    └── powershell/    # Windows 脚本
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
storyspec init 我的小说 --no-git
```

### Q: 中文目录名有问题

在某些系统上，中文目录名可能导致问题。建议使用英文或拼音：

```bash
storyspec init my-novel
# 或
storyspec init wo-de-xiao-shuo
```

### Q: AI 助手无法识别斜杠命令

1. 确保项目已正确初始化
2. 检查 `.specify/spec.md` 文件是否存在
3. 在 AI 助手中明确说明你在使用 StorySpec
4. 尝试复制命令内容手动输入

## 升级 StorySpec

```bash
# 查看当前版本
novel --version

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
- 💬 访问 [GitHub Issues](https://github.com/wordflowlab/story-spec/issues)
- 📧 联系支持：support@novelwriter.io

---

下一步：[快速入门](quickstart.md) →