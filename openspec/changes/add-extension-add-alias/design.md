## 设计

`extension:add` 是 `plugins:add` 的薄 alias。实现上抽出共享 handler，例如 `runPluginAddCommand({ entryLabel })`，两个命令只传入展示文案差异，不复制 resolve / plan / apply 逻辑。

## 展示口径

- `plugins:add` 标题保持“StorySpec 插件安装”。
- `extension:add` 标题显示“StorySpec 扩展安装”。
- 两个入口的 dry-run 都显示 `Manifest kind: <kind>`。
- 若 manifest kind 不是 `extension`，第一版仍允许安装，但输出中明确当前 kind；不做强阻断，避免 alias 破坏通用安装兼容。

## 安全边界

- 继续使用 `PluginManager.resolvePluginSource`，不新增远程 marketplace。
- 继续使用 `planInstallPlugin` 和 `applyInstallPlan`。
- 冲突默认阻断，`--force` 仍可覆盖。
- dry-run 不写文件。

## 非目标

- 不新增 extension registry。
- 不改变 manifest schema。
- 不改变插件安装目标路径或 agent renderer。
