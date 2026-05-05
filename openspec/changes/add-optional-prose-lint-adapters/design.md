## 设计

第一版先建立 adapter 边界，不在 CLI 中执行真实外部工具。

## 配置

读取 `spec/style/adapters.json`：

```json
{
  "adapters": [
    { "id": "vale", "enabled": true },
    { "id": "textlint", "enabled": false }
  ]
}
```

字段：

- `id`: `vale` 或 `textlint`
- `enabled`: `false` 时跳过，默认 true

未知 adapter 生成 `STYLE_ADAPTER_SKIPPED` info finding，并标记 skipped。

## Runner

`lintStyle` 新增可选 `adapterRunner`：

```ts
type ProseLintAdapterRunner = (input) => Promise<StyleLintFinding[]>
```

CLI 不传 runner，因此配置存在时输出 skipped：“未配置外部 prose lint runner”。测试可注入 runner，验证外部 finding 合并和 `source` 字段。

## 输出

`StyleLintResult` 新增：

- `adapters: Array<{ id; source; status; message }>`

`StyleLintFinding` 新增可选：

- `source?: "built-in" | "vale" | "textlint" | string`

summary 继续按 severity 统计全部 finding。

## 非目标

- 不把 Vale/textlint 加入 dependencies。
- 不调用子进程。
- 不自动修改正文。
- 不改变 `style:explain`。
