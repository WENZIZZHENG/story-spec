---
description: 采样、查看和修正作者长期偏好画像
argument-hint: [--init|--confirm <id>|--deprecate <id>|--ignore <id>|--clear]
allowed-tools: Read(//.specify/memory/author-profile.json), Read(.specify/memory/author-profile.json), Write(//.specify/memory/author-profile.json), Write(.specify/memory/author-profile.json), Bash(*)
model: claude-sonnet-4-5-20250929
scripts:
  sh: .specify/scripts/bash/check-writing-state.sh
  ps: .specify/scripts/powershell/check-writing-state.ps1
---

用户输入：$ARGUMENTS

## 目标

维护 `.specify/memory/author-profile.json`。作者画像只服务推荐、示例和提示词上下文，不是故事正典，也不能覆盖当前故事中用户明确回答的 `clarifications.json`。

## 使用边界

- 第一次使用没有历史画像可回填，只能做轻量偏好采样。
- 首次采样默认 2-4 个问题，全部允许跳过。
- 采样结果写为 `provisional`，确认后才可作为强偏好复用。
- 后续使用可以读取已确认画像，帮助减少重复提问。
- 单次故事选择不能自动升级为长期偏好；只能作为候选，等待作者确认。
- 作者可以确认、废弃、忽略或清空任意画像条目。

## 首次采样问题

只选择最有价值的 2-4 个问题：

1. 近期最想写的题材、风味或读者承诺是什么？
2. 你更喜欢慢热铺垫、单元冒险、快节奏爽点，还是混合节奏？
3. 叙述声音更偏幽默、克制、热血、冷静，还是别的口味？
4. 明确不想写成什么样？有哪些创作禁区或踩雷点？

每个问题都要提供“跳过/稍后再说”选项。不要把这些问题变成重度 onboarding。

## 输出结构

写入 JSON 时使用：

```json
{
  "schemaVersion": "1.0",
  "updatedAt": "ISO-8601",
  "notes": [
    "作者画像只影响推荐、示例和提示词上下文，不是故事正典。",
    "首次使用可以跳过；采样条目默认 provisional，确认后才复用为强偏好。"
  ],
  "entries": [
    {
      "id": "pref.genre",
      "category": "genre",
      "label": "题材偏好",
      "value": "用户原话",
      "status": "provisional",
      "source": "sampled",
      "evidence": ["作者画像首次/手动采样"],
      "createdAt": "ISO-8601",
      "updatedAt": "ISO-8601"
    }
  ]
}
```

## 完成报告

报告时说明：

- 写入路径。
- 新增、确认、废弃、忽略或清空了哪些条目。
- 哪些偏好仍是 `provisional`。
- 明确提醒：这些偏好只影响推荐和示例，不进入故事正典。
