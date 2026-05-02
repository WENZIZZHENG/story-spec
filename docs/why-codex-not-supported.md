# Codex CLI 支持说明与历史归档

## 当前状态

Novel Writer 已支持 Codex CLI。

- 支持版本：v0.19.0+
- 命令目录：`.codex/prompts/`
- 命名格式：`/novel-命令名`
- Prompt 格式：纯 Markdown，无 YAML frontmatter
- 初始化方式：`novel init my-novel --ai codex`
- 状态检查：`novel codex-status`

从 v0.20.x 开始，Codex 项目会额外生成根目录 `AGENTS.md`，用于说明读取顺序、规划/写作边界、关键文件位置和高风险剧情节点的处理方式。该文件只在不存在时创建，不覆盖作者已有约定。

## 推荐流程

```bash
npm install -g novel-writer-cn
novel init my-novel --ai codex
cd my-novel
novel codex-status
```

在 Codex 中继续使用：

```text
/novel-constitution
/novel-specify
/novel-clarify
/novel-plan
/novel-tasks
/novel-write
/novel-analyze
```

## 设计取舍

Codex prompts 使用纯 Markdown，因此 Novel Writer 的 Codex 版本不会保留 YAML frontmatter。构建脚本会把 `templates/commands/*.md` 中的正文转换为 `.codex/prompts/novel-*.md`，并将脚本路径写入 prompt 内容，由 Codex 在执行时读取和运行。

为了让 Codex 更容易接手长篇项目，`novel codex-status` 会汇总：

- 当前项目版本和写作方法
- 已安装 AI 配置，尤其是 `.codex/prompts/`
- 当前故事的 `specification.md`、`creative-plan.md`、`tasks.md`
- 下一条未完成任务
- `spec/tracking/*.json` 是否可解析
- Git 工作区是否有未提交改动

## 历史原因

v0.18.x 及更早版本曾暂不支持 Codex，主要因为早期 Custom Prompts 对脚本执行、文件操作和结构化状态返回的支持方式与 Novel Writer 的命令系统不匹配。

后来通过参考 Spec-Kit 的 Codex prompt 组织方式，Novel Writer 改为对 Codex 输出纯 Markdown prompt，并保留命令正文中的脚本执行步骤，因此可以覆盖七步方法论和追踪命令。

## 仍需注意

- Codex 的实际执行质量取决于它是否按 prompt 读取上下文和运行脚本。
- 长篇项目建议先运行 `novel codex-status`，再决定继续规划、拆任务还是写正文。
- 如果只想规划，不要执行 `/novel-write`；使用 `/novel-plan` 或 `/novel-tasks` 并在任务中保留 `[PLAN-ONLY]`。
