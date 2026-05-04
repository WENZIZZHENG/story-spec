# 新增长文创作资料吸收命令

- 新增 `storyspec ingest [story] --text <text>` 和 `--file <path>`，可把自然语言长文拆成核心澄清项预览。
- 默认只预览识别结果，不修改 `clarifications.json/md`。
- 新增 `--apply-confirmed`，仅把识别为作者明确字段表达的内容写入 `source: user-explicit`、`confirmed: true` 的澄清记录。
