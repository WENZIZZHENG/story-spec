## 设计

`todo:capture` 是待办治理的上游入口，不是开发执行器。它只把用户提供的 notes 转成结构化 roadmap 草案，默认 preview 展示将写入的内容；只有 `--apply` 才写入文件。

## 输入

- `--topic <name>`：必填，人读标题，可包含中文。
- `--from <path>`：从本地文本或 Markdown 文件读取 notes。
- `--notes <text>`：直接传入 notes。
- `--apply`：写入路线文件并更新 `todo-index.md`。
- `--json`：输出结构化结果。

`--from` 和 `--notes` 二选一；都缺失或同时传入时 blocked。

## 输出

- `topic`: 原始 topic。
- `slug`: 用于文件名的 kebab-case slug。
- `roadmapPath`: `docs/tech/<slug>-roadmap.md`。
- `indexPath`: `docs/tech/todo-index.md`。
- `mode`: `preview` 或 `apply`。
- `wouldWrite`: preview 时列出将写入文件，apply 时列出实际更新文件。
- `draftRoadmap`: 生成的可编辑草案。
- `indexPatchPreview`: 将追加到 todo-index 当前待办表的行。
- `blocked`: 是否阻断。
- `blockedReasons`: 阻断原因。
- `nextActions`: 下一步建议。
- `updatedFiles`: apply 后写入的文件。

## 草案模板

第一版不做复杂解析，只从 notes 提取非空行作为“原始记录摘要”，并填充完整治理字段：背景和目标、非目标、P1 捕获任务、验收标准、风险与边界、完成同步。无法确定的字段标记为“待人工确认”，但不使用 `TBD` / `TODO`，避免 `docs:finish` placeholder 门禁误判。

## 写入策略

- 目标 roadmap 已存在时 blocked。
- `todo-index.md` 不存在时 blocked。
- apply 只新增 roadmap 并在“当前待办”表格末尾追加一行。
- 不移动归档、不改 completed roadmap、不生成 changeset。

## 非目标

- 不调用 LLM。
- 不自动判断任务可行性或优先级正确性。
- 不创建 OpenSpec change；后续开发仍需把选中的待办转为 OpenSpec。
