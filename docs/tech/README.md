# Novel Writer 技术文档

欢迎来到 Novel Writer 技术文档中心！这里提供了详细的架构设计、技术实现和开发指南。

---

## 📐 架构文档

### [技术架构文档](architecture.md)

完整的技术架构说明，包括：

- **架构图** - 可视化系统架构和数据流
- **核心组件** - CLI 工具、AI 平台集成、插件系统
- **七步方法论** - 详细的实现机制
- **验证追踪系统** - Checklist、Track 等工具
- **技术栈** - 使用的所有技术和依赖
- **扩展性** - 多平台支持、插件机制
- **版本演进** - 从 v0.10.0 到 v0.16.x 的发展历程
- **设计哲学** - 克制、规格驱动、允许偏离、频繁验证

**适合人群**：
- 🔧 想深入了解系统设计的开发者
- 🤝 想为项目做贡献的贡献者
- 🔌 想开发插件的开发者
- 📚 想理解技术原理的高级用户

### [Codex 适配优化记录](codex-optimization.md)

记录 Codex 状态命令、`AGENTS.md` 模板、任务边界和世界观模板增强的设计取舍。

### [命令输入澄清引导](command-onboarding.md)

记录 `argument-hint` / `arguments.hint` 如何在多 agent 命令产物中转化为用户可见的输入澄清引导。

### [创作控制权体验优化路线图](creative-control-roadmap.md)

记录后续围绕澄清优先、示例分叉、写入前预览、来源追踪和创作状态可见性的详细开发待办。

### [AI 平台 Registry 重构记录](ai-platform-registry-refactor.md)

记录将 AI 平台目录、构建产物、显示名和命令前缀收敛为单一 typed registry 的架构取舍。

### [全面重构待办](full-refactor-todo.md)

记录后续完全重构 Novel Writer 的阶段路线、任务清单、验证门槛和参考项目。

---

## 🖼️ 架构图

![Novel Writer 架构图](images/novel-writer-architecture.svg)

**架构图说明**：

该图展示了 Novel Writer 的完整工作流程：

1. **角色层**（蓝色）- 作者、规划者、创作工程师、质量检查、文档编辑
2. **AI 工具层**（红色）- 规划 AI、写作助手、验证追踪 AI、文档生成
3. **数据层**（棕色）- 规格文档、章节内容、追踪数据、知识库
4. **系统层**（虚线框）- GitHub、文件系统、配置存储
5. **输出层**（棕色）- 用户文档、质量报告

**关键流程**：
- 从用户需求到规格定义
- 从规格到创作计划和任务
- 从任务到实际内容创作
- 从内容到验证和质量报告
- 质量反馈循环优化

---

## 🛠️ 开发相关

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/wordflowlab/novel-writer.git
cd novel-writer

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 构建命令（生成多平台命令文件）
npm run build:commands
```

### 项目结构

```
novel-writer/
├── src/                        # TypeScript 源代码
│   ├── cli.ts                 # CLI 主入口
│   ├── plugins/               # 插件管理器
│   └── utils/                 # 工具函数
│
├── templates/                  # 模板文件
│   ├── commands/              # 命令模板（单一源）
│   ├── plugins/               # 插件模板
│   └── ...
│
├── scripts/                    # 构建和辅助脚本
│   ├── build/
│   │   └── generate-commands.sh  # 多平台命令生成
│   ├── bash/                  # Bash 脚本库
│   └── powershell/            # PowerShell 脚本库
│
├── dist/                       # 编译输出
│   ├── cli.js                 # CLI 主程序
│   └── commands-*/            # 各平台命令文件
│
└── docs/                       # 文档
    ├── tech/                  # 技术文档（本目录）
    └── ...
```

### 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 18+ | 运行时 |
| TypeScript | 5.3+ | 开发语言 |
| Commander.js | 12.0+ | CLI 框架 |
| Inquirer.js | 9.2+ | 交互问答 |
| fs-extra | 11.2+ | 文件操作 |
| js-yaml | 4.1+ | YAML/TOML |
| Chalk | 5.3+ | 终端颜色 |

---

## 🔌 插件开发

### 插件结构

```
templates/plugins/my-plugin/
├── plugin.json                 # 插件元数据
├── commands/
│   ├── my-command.md          # 命令文件
│   └── ...
├── memory/                    # 可选：记忆文件
│   └── my-config.md
└── knowledge/                 # 可选：知识库
    └── my-knowledge.md
```

### 创建插件

1. **创建目录结构**
```bash
mkdir -p templates/plugins/my-plugin/commands
mkdir -p templates/plugins/my-plugin/memory
```

2. **定义插件元数据** (`plugin.json`)
```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "我的自定义插件",
  "author": "Your Name",
  "commands": [
    {
      "name": "my-command",
      "description": "我的命令"
    }
  ]
}
```

3. **编写命令文件** (`commands/my-command.md`)
```markdown
---
description: 我的命令描述
---

# My Command

命令内容...
```

4. **构建和测试**
```bash
npm run build:commands
novel plugins add my-plugin
```

### 官方插件参考

- [`authentic-voice`](../../templates/plugins/authentic-voice/) - 真实人声插件
- [`translate`](../../templates/plugins/translate/) - 翻译插件
- [`luyao-style`](../../templates/plugins/luyao-style/) - 路遥风格插件

---

## 📚 相关文档

### 用户文档
- [安装指南](../installation.md) - 详细安装步骤
- [快速开始](../quickstart.md) - 5 分钟快速入门
- [工作流程](../workflow.md) - 完整创作流程
- [命令详解](../commands.md) - 所有命令的详细说明
- [最佳实践](../best-practices.md) - 实战经验和技巧

### 进阶文档
- [实战指南](../writing/practical-guide.md) - 基于《重返1984》的 SDD 实践
- [写作方法](../writing-methods.md) - 6 种经典写作方法
- [升级指南](../upgrade-guide.md) - 版本升级说明

### 开发文档
- [本地开发](../local-development.md) - 本地开发环境设置
- [多平台支持](../gemini-command-guide.md) - Gemini CLI 开发指南
- [插件开发提示](../plugin-dev-prompt.md) - 插件开发最佳实践

---

## 🤝 贡献指南

### 贡献类型

1. **代码贡献**
   - 修复 Bug
   - 添加新功能
   - 性能优化

2. **文档贡献**
   - 改进文档
   - 添加示例
   - 翻译文档

3. **插件贡献**
   - 开发新插件
   - 改进现有插件

4. **反馈贡献**
   - 提交 Issue
   - 功能建议
   - 使用体验反馈

### 贡献流程

1. **Fork 仓库**
```bash
git clone https://github.com/YOUR_USERNAME/novel-writer.git
cd novel-writer
git checkout -b feature/my-feature
```

2. **开发和测试**
```bash
npm install
npm run dev
# 测试你的更改
```

3. **提交 Pull Request**
- 确保代码通过 lint 和 format
- 编写清晰的 commit message
- 在 PR 中描述你的更改

### 代码规范

- 使用 TypeScript
- 遵循 ESLint 规则
- 编写清晰的注释
- 保持向后兼容

---

## 🐛 问题反馈

### 提交 Issue

遇到问题？请在 GitHub 提交 Issue：

**[https://github.com/wordflowlab/novel-writer/issues](https://github.com/wordflowlab/novel-writer/issues)**

**Issue 模板**：
```markdown
### 问题描述
[清楚描述问题]

### 复现步骤
1. 执行命令 `novel init my-novel`
2. 运行 `novel check`
3. 看到错误信息...

### 期望行为
[描述期望的行为]

### 实际行为
[描述实际发生的行为]

### 环境信息
- OS: macOS 14.0
- Node.js: v20.10.0
- Novel Writer: v0.16.3
- AI 平台: Claude Code
```

---

## 📞 联系方式

- **GitHub**: [wordflowlab/novel-writer](https://github.com/wordflowlab/novel-writer)
- **Issues**: [提交问题](https://github.com/wordflowlab/novel-writer/issues)
- **Discussions**: [讨论区](https://github.com/wordflowlab/novel-writer/discussions)

---

## 📜 许可证

MIT License

---

**Novel Writer** - 让 AI 成为你的创作伙伴！ ✨📚

*最后更新: 2025-10-12*
