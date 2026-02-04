# 存储迁移说明

## 概述

已将所有应用数据从 `localStorage` 迁移到本地文件系统，解决了大型快照保存失败的问题。

## 存储位置

所有数据现在存储在用户主目录的 `.disk-rookie` 文件夹中：

```
~/.disk-rookie/
├── settings.json              # AI 设置（API URL、Key、模型等）
├── system-prompt.txt          # AI 系统提示词
├── prompt-instruction.txt     # 用户自定义提示词指令
├── theme.txt                  # 主题设置（light/dark/system）
└── snapshots/                 # 快照目录
    ├── index.json             # 快照索引（元数据列表）
    └── <snapshot-id>.json     # 各个快照的完整数据
```

## 主要改进

### 1. 无限存储空间
- **之前**: localStorage 限制约 5-10MB，大型快照会失败
- **现在**: 使用文件系统，理论上无限制（取决于磁盘空间）

### 2. 性能优化
- **之前**: 所有快照存在一个大 JSON 中，读写慢
- **现在**: 每个快照独立文件，只加载需要的数据

### 3. 数据持久化
- **之前**: 浏览器清除缓存会丢失数据
- **现在**: 数据独立于浏览器，永久保存

### 4. 跨平台统一
- macOS: `~/.disk-rookie/`
- Windows: `C:\Users\<用户名>\.disk-rookie\`
- Linux: `~/.disk-rookie/`

## 技术实现

### 后端 (Rust)

新增文件系统操作命令 (`src-tauri/src/commands/storage.rs`):

- `read_storage_file` - 读取文件
- `write_storage_file` - 写入文件
- `delete_storage_file` - 删除文件
- `list_storage_files` - 列出目录文件
- `get_storage_path` - 获取存储根目录

### 前端 (TypeScript)

1. **存储服务** (`frontend/src/services/storage.ts`)
   - 封装 Tauri 文件系统 API
   - 提供便捷的 JSON 读写方法

2. **快照服务** (`frontend/src/services/snapshot.ts`)
   - 使用文件系统存储快照
   - 索引文件记录元数据，单独文件存储完整数据
   - 自动清理：保留最新 50 个快照

3. **AI 服务** (`frontend/src/services/ai.ts`)
   - 设置和系统提示词存储到文件系统
   - 异步加载/保存接口

4. **组件更新**
   - `ExpertMode.tsx` - 提示词指令存储
   - `AISettings.tsx` - 设置保存
   - `SnapshotDialog.tsx` - 快照加载/删除
   - `App.tsx` - 主题设置

## 数据迁移

**首次启动后，旧的 localStorage 数据不会自动迁移。**

用户需要：
1. 重新配置 AI 设置
2. 旧快照将不可见（但 localStorage 数据仍在，可手动导出）

如需自动迁移，可以在应用启动时添加迁移脚本。

## 测试建议

1. 测试大型目录扫描并保存快照
2. 测试多个快照的加载和删除
3. 测试设置的保存和恢复
4. 测试应用重启后数据持久性
5. 验证 `.disk-rookie` 目录创建和权限

## 潜在改进

1. **数据压缩**: 对大型快照进行 gzip 压缩
2. **自动备份**: 定期备份到云端或其他位置
3. **数据加密**: 对敏感数据（API Key）进行加密存储
4. **导入导出**: 提供数据导入导出功能
5. **迁移向导**: 首次启动时提供从 localStorage 迁移的向导
