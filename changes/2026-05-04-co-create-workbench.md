# 连续共创输入入口

- 新增 `storyspec co:create [story]`，可在一条命令里串联长文吸收、核心信息面板和可选 preview。
- 默认模式只预览，不写入澄清记录；传 `--apply-confirmed` 后才写入识别为作者明确表达的字段。
- 支持 `--preview specify|plan|both` 生成写入前预览，正式文件仍需 `storyspec apply <preview-id> --yes` 才会覆盖。
