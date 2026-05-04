# 无标题长文候选识别

- `storyspec ingest` 现在会把无标题自然段按关键词归入候选分组，例如主角、第一舞台、能力体系和创作边界。
- 这些候选使用较低置信度，只出现在 `candidateItems`，即使传入 `--apply-confirmed` 也不会自动写入 `clarifications.json`。
- 明确字段标签仍按原逻辑进入 confirmed 写入预览，继续保持作者确认门禁。
