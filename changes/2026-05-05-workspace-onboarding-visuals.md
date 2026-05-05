---
change_type: minor
scope: init,onboarding,creative-report
---

# 工作区初始化与首程视图优化

## CLI 行为

- `storyspec init` 新增 `--workspace <path>`，支持直接指定小说工作区绝对路径或相对路径。
- 交互式初始化在缺少项目名、`--workspace` 和 `--here` 时，会先询问小说工作区放在哪里，再继续选择 agent、写作方法和专家模式。
- 初始化成功后的下一步提示改为显示已就绪的工作区路径，并引导作者先运行 `storyspec next` 查看素材分流。

## 创作反馈

- `storyspec next` 的素材入口输出补充“长文资料 / 一句灵感 / 表格资料 / 随便聊聊”类型标签，降低第一次使用时的理解成本。
- `creative:report` 在卷计划摘要后追加 Mermaid 视图，帮助作者快速看到三幕结构、角色弧线、剧情起伏和人物关系的关系。

## 模板契约

- 未修改 agent command 模板，不手工编辑 `dist/**`。
- 初始化后的人类输出继续只给可执行的下一步命令，不写入用户故事正典。

## 生成产物

- 不新增用户故事正文或真实用户项目数据。
- 不手工修改发布产物；如后续模板变化，仍需通过 `npm run build:commands` 和 manifest 检查生成。

## 验证

- 已运行相关单元测试。
- 已运行 `npm run build`。
- 已运行 `npm run check:changes`。
