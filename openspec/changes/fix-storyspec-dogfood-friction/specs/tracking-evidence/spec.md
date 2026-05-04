## ADDED Requirements

### Requirement: completedNodes 必须保持字符串数组
tracking 记录中的 `completedNodes` MUST 继续保持字符串数组类型，且顺序 MUST 可被旧脚本稳定读取。

#### Scenario: 旧脚本读取 tracking
- **WHEN** 旧消费方读取 tracking 记录
- **THEN** 它 MUST 仍然看到字符串数组形式的 `completedNodes`

#### Scenario: 节点顺序保持
- **WHEN** 系统写入新的 tracking 记录
- **THEN** `completedNodes` 的顺序 MUST 与完成顺序一致

### Requirement: tracking 记录 MUST 支持可选 completedNodeEvidence
tracking 记录 MUST 支持在 `completedNodes` 之外携带一个可选的 `completedNodeEvidence` 字段，用于保存与完成节点相关的证据。

#### Scenario: 新格式写入 completedNodeEvidence
- **WHEN** 系统产生带证据的 tracking 记录
- **THEN** 记录 MUST 保留 `completedNodes`，并且 MAY 同时包含 `completedNodeEvidence`

#### Scenario: 旧格式兼容
- **WHEN** 系统读取没有 `completedNodeEvidence` 的历史 tracking 记录
- **THEN** 读取过程 MUST 成功且不得要求补齐 `completedNodeEvidence`

### Requirement: tracking 校验必须拒绝错误的 completedNodes 类型
tracking 校验 MUST 拒绝将 `completedNodes` 变更为非字符串数组的记录。

#### Scenario: 错误类型输入
- **WHEN** `completedNodes` 被写成对象数组或其他非字符串数组类型
- **THEN** 校验 MUST 失败

#### Scenario: 兼容性输入
- **WHEN** `completedNodes` 仍然是字符串数组而 `completedNodeEvidence` 为空或缺失
- **THEN** 校验 MUST 通过
