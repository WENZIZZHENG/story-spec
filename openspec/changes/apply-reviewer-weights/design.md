## 设计

新增一个轻量权重解析路径，保持 reviewer loop 的 finding 分类和 task draft 逻辑不变。

## 权重来源优先级

1. `spec/reviewer-config.json`：项目级配置，优先级最高。
2. 当前 active preset manifest：通过 `spec/presets/current-preset.json` 和 `.specify/presets/<id>/preset.yaml` 读取。
3. default：未配置时权重为 `1`。

`spec/reviewer-config.json` 只读取形如：

```json
{
  "reviewerWeights": {
    "worldbuilding": 1.4,
    "reader": 1.2
  }
}
```

非数字、非有限值或缺失 key 直接忽略，对应 reviewer 回落到 default。

## Score 公式

当前基础扣分保持不变：

- error：18
- warning：8
- info：3

新增权重后：

```text
score = max(0, 100 - basePenalty * weight)
```

默认 weight 为 1，因此未配置项目的 score 与旧行为一致。

## 输出契约

每个 `ReviewerReport` 增加：

- `weight: number`
- `weightSource: "project" | "preset" | "default"`

文本渲染在 reviewer 标题中附加 `权重 <value>，来源 <source>`，让非 JSON 用户也能看到影响。

## 非目标

- 不改变 finding 的 reviewerId 分类。
- 不改变 task draft 生成。
- 不新增项目级配置写入命令。
- 不让权重自动修改正文。
