---
change_type: minor
scope: onboarding,writing,tracking,commands
---

# Dogfood 首程与写作反馈优化

## CLI 行为

- `storyspec next` 的应用层结果新增素材入口清单，默认渲染先提示作者选择“长文资料 / 一句灵感 / 表格资料 / 随便聊聊”，再给出对应可复制命令和输入建议。
- `task:finish` 能识别 `content/chapter-*.md`、`content/volume*/chapter-*.md`、`stories/<story>/content/...`、短路径章节和 Windows 分隔符，并输出包含正文路径、验证命令和更新文件的单屏收尾摘要。
- CLI smoke 覆盖 `task:finish` 和 `tasks:set-status` 在构建后 help 中可见，防止本地产物和发布产物漂移。

## 模板契约

- `/storyspec-write` 模板要求正式写作前先输出 3-6 条 scene beat / direction preview，再分块生成正文，最后给出收尾摘要。
- `/storyspec-write` 继续要求遵守 preview / confirm / apply；缺少正文语境、tracking 或人物事实时必须列为待确认信息，不能替作者补成正典。
- `/storyspec-write` 的收尾摘要需要包含草稿路径、已运行或建议运行的校验、tracking 待确认 / 已应用状态，以及下一步建议动作。
- plot tracking 模板新增可选 `completedNodeEvidence` 旁路字段；`completedNodes` 仍保持字符串数组，旧脚本兼容读取。

## 生成产物

- 多 agent 命令产物内容发生变化，已更新 `tests/fixtures/command-artifacts.manifest.json`。
- `templates/tracking/plot-tracker.json` 初始化产物会带有空的 `completedNodeEvidence` 对象，便于后续记录完成证据。
- `dist/` 仍是本地构建输出，不纳入 Git；发布或本地初始化前需要运行 `npm run build:commands` 和 `npm run build` 生成最新产物。

## 验证

- 已运行相关单元测试、OpenSpec strict 校验、command manifest 检查、CLI smoke 测试和完整 `npm run verify`。
