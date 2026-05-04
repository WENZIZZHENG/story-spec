# 支持访谈答案中文别名

- `storyspec interview/clarify --answers` 支持 `主角=...;第一舞台=...;伙伴=...;能力体系=...` 等中文别名。
- 原有 `questionId=answer` 格式保持兼容。
- 别名在 CLI 解析阶段映射到正式 `questionId`，写入记录仍使用稳定字段。
