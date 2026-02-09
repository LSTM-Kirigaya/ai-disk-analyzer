# MFT 磁盘扫描与渲染优化分析

本文档分析从前端触发扫描到树图渲染完成的整条链路，并给出可缩短总耗时的优化建议。

---

## 一、当前流程概览

```
前端 invoke('scan_path_command')
    → Tauri spawn_blocking → scan_path_with_progress
        → scan_volume_mft (卷根)
            [阶段1] 打开卷 + 流式读 $MFT（或一次性 Mft::new）
            [阶段2] 边收边枚举：records / child_index / recursive_sizes
            [阶段3] build_tree_from_mft_records（并行建树）
        → Ok(ScanResult { root: FileNode, ... })
    → Tauri 将整个 ScanResult 序列化为 JSON 返回
前端 setResult(res) → Treemap(root) 布局 + 渲染
（非管理员时）buildFileListSummary(result) → AI 分析
```

---

## 二、后端优化点

### 2.1 阶段 1：MFT 读取（通常占比最高）

- **现状**：有 progress 时已用生产者-消费者流式读 $MFT，边收边用 `MftRef` 迭代；无 progress 时 `Mft::new` 一次性读入。
- **瓶颈**：磁盘 I/O，难以并行。
- **可做**：
  - 若 ntfs-reader 支持，适当增大流式读的块大小，减少系统调用次数。
  - 确保始终走「有 progress 的流式路径」（前端已传 progress），避免一次性加载。

### 2.2 阶段 2：枚举 + 建索引（records / child_index / recursive_sizes）

- **现状**：单线程在消费者里处理；每收到一块数据就对 `iterate_files_range` 回调里每个文件：
  - 写 `records`、更新 `child_index`
  - 更新 `recursive_sizes`：当前实现对每个文件沿路径向上逐级 `rfind('\\')` 更新所有祖先，单文件约 O(路径深度)。
- **可做**：
  - **recursive_sizes**：改为只记录「直接 size」到 `recursive_sizes[path]`，建树前用一次自底向上或并行归并得到递归大小，避免在热路径上反复字符串切分。
  - 若后续有需求，可评估在枚举阶段用多线程处理「已收到的 MFT 块」（需注意 ntfs-reader 是否线程安全）。

### 2.3 阶段 3：建树（build_tree_from_mft_records）

- **现状**：根的直接子节点已用 `par_iter()` 并行；内部 `build_subtree_from_indices` 为递归、每约 5000 节点上报一次进度。
- **可做**：
  - **进度频率**：`BUILD_TREE_PROGRESS_EVERY = 5000` 已较合理；若 IPC 成为瓶颈，可适当调大（如 10000），减少 emit 次数。
  - **树规模与前端一致**：前端 Treemap 只用到 **MAX_DEPTH=6**、且每层只渲染 `children`；后端当前 **MAX_DEPTH=10、MAX_CHILDREN_PER_DIR=500**。建树和序列化都在做 10 层、每层最多 500 子节点，多出的 4 层和多余子节点会增大内存和序列化/传输/解析成本，而前端并不展示。

**建议**：为「返回给前端的树」单独使用与 Treemap 一致的裁剪常数，例如：

- 建树时：对「返回用树」限制深度为 6、每目录最多保留前 N 个子节点（如 200 或 300，按 size 排序），或
- 在 `scan_volume_mft` 返回前，对 `ScanResult.root` 做一次「剪枝」：只保留深度 ≤ 6、每层最多 K 个子节点（按 size 取 top-K）。

这样既减少后端建树/序列化工作量，也直接减小 payload，缩短 IPC 和前端解析时间（见下文）。

### 2.4 进度回调与 IPC

- **现状**：`PROGRESS_EVERY = 5000`，每 5000 文件 emit 一次 `scan-progress`，消息含 `(count, path_str)`。
- **可做**：
  - 若 path 仅用于日志/调试，可考虑在 progress 里只传 `count` 或更短摘要，减少序列化与 IPC 体积。
  - 适当增大 `PROGRESS_EVERY`（如 10000）在超大卷上可略微减少 IPC 次数，对体感进度平滑度影响有限。

---

## 三、序列化与传输（Tauri IPC）

- **现状**：整个 `ScanResult`（含完整 `root: FileNode` 树）由 Tauri 序列化为 JSON 一次返回；前端 `invoke<ScanResult>(...)` 再反序列化。
- **问题**：树越大（数十万～百万节点），序列化/反序列化与传输时间越明显，且会阻塞主线程。
- **建议**（按收益/实现成本排序）：
  1. **缩小返回树**（与 2.3 一致）：只返回「展示用树」（深度 6、每层 top 子节点），可显著减小 JSON 体积与解析时间。
  2. 若仍不满足：考虑「分步返回」——先返回 `ScanResult` 的摘要（`file_count`, `total_size`, `scan_time_ms` 等）加上「根及第一层子节点」；子节点展开时再通过新 command 按 path 懒加载子树（需后端支持按 path 查询已扫结果）。这样首屏更快，但需前后端协议与 UI 改造。
  3. 若 Tauri 支持二进制 IPC（如 bincode），可评估用二进制替代 JSON 以减轻 CPU 与体积，但需与「缩小树」一起看收益。

---

## 四、前端优化点

### 4.1 接收与解析

- **现状**：`await invoke<ScanResult>('scan_path_command', ...)` 一次拿到整棵树的 JSON 并解析。
- **建议**：依赖后端「缩小树」后，同一调用下解析量自然下降；无需改前端调用方式即可受益。

### 4.2 Treemap 渲染

- **现状**：`useMemo` 对 `root` 做 `layoutRecursive(root, ...)`，内部只用到深度 ≤ 6、`children` 且 `size > 0`。
- **建议**：若后端已做「深度 6 + 每层限制子节点数」的剪枝，则前端拿到的 `root` 更小，布局计算与重绘都会更快；无需改 Treemap 逻辑。

### 4.3 buildFileListSummary 与 AI 分析（非管理员）

- **现状**：扫描完成后若 `isAdmin === false`，会调用 `buildFileListSummary(result)`：遍历整棵 `result.root`，收集所有文件节点，按 size 排序后取前 `promptFileCount` 条生成 Markdown，再调 AI。
- **问题**：又一次完整遍历大树，且发生在「扫描已完成、用户已等待」之后，拉长「到 AI 结果」的时间。
- **建议**：
  1. **后端附带 top 列表**：MFT 扫描时已具备「按 size 取前 N 个文件」的能力（`scan_volume_mft_top_files`）。可在 `ScanResult` 中增加可选字段，例如 `top_files: Option<Vec<{ path, size, modified }>>`，在 `scan_volume_mft` 中顺带填好（与建树同一次枚举或单独一次轻量遍历），数量与 `promptFileCount` 同量级（如几百）。
  2. **前端**：若存在 `result.top_files`，则 `buildFileListSummary` 直接基于 `top_files` 生成 Markdown，不再遍历 `result.root`，这样既减少前端计算，也缩短「扫描结束 → AI 结果」的体感时间。

---

## 五、优化项汇总与优先级

| 优先级 | 优化项 | 位置 | 预期效果 |
|--------|--------|------|----------|
| 高 | 返回树剪枝：深度 6、每层限制子节点数（按 size 取 top） | 后端 mft_scan | 显著减小 payload、序列化与前端解析/布局时间 |
| 高 | ScanResult 增加 top_files；前端 buildFileListSummary 优先用 top_files | 后端 + 前端 | 缩短「扫描完成 → AI 结果」时间，避免再次遍历整树 |
| 中 | recursive_sizes 改为先记直接 size，再单独一次自底向上/并行汇总 | 后端 mft_scan | 降低阶段 2 CPU 与锁竞争，缩短枚举阶段 |
| 中 | 适当增大 PROGRESS_EVERY / BUILD_TREE_PROGRESS_EVERY | 后端 | 略减 IPC 与回调开销 |
| 低 | 进度消息只传 count 或短摘要 | 后端 | 略减 IPC 体积 |
| 低 | 评估 MFT 流式读块大小、二进制 IPC | 后端/集成 | 视实测决定是否投入 |

---

## 六、建议实施顺序

1. **先做「返回树剪枝」**：与 Treemap 的 MAX_DEPTH=6 对齐，并限制每层子节点数；观察端到端耗时与首屏时间的改善。
2. **再加 top_files + 前端用其做摘要**：在不大改 API 的前提下缩短 AI 分析前的准备时间。
3. 若阶段 2 的 CPU 仍占比较高，再考虑 **recursive_sizes 的两次遍历优化** 和进度频率/消息体积的微调。

以上优化均不改变现有「单次 invoke 扫描、一次返回整结果」的用法，仅通过缩小 payload 和减少重复遍历来缩短整体时间；若后续需要「懒加载子树」，再在剪枝基础上扩展 API 与 UI。
