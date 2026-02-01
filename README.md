# AI 磁盘分析工具 (AI Disk Analyzer)

基于 AI 的智能磁盘分析与整理工具，帮助用户快速整理磁盘上的无用文件，对冷数据提供迁移方案与建议。

## 项目架构

```
ai-disk-analyzer/
├── apps/
│   └── desktop/                 # GUI App（Tauri）
│       ├── src-tauri/           # Rust 后端
│       │   ├── src/
│       │   │   ├── commands/    # GUI ↔ Core 桥接
│       │   │   ├── main.rs
│       │   │   └── lib.rs
│       │   └── Cargo.toml
│       └── frontend/            # React + Vite + TailwindCSS
├── crates/
│   ├── disk-scanner/            # 磁盘扫描层
│   ├── domain-model/            # 核心领域模型
│   ├── ai-engine/               # AI 推理与规划层
│   ├── executor/                # 执行层
│   └── common/                  # 公共模块
├── docs/
│   └── ui-spec.md               # UI 设计规范（工业集成风格）
├── Cargo.toml                   # Workspace
└── README.md
```

## 快速开始

### 环境要求

- Rust (rustc 1.86+)
- Node.js 20+
- 系统：Windows / macOS / Linux

### 开发

```bash
# 安装依赖
cd apps/desktop
npm install
cd frontend && npm install && cd ..

# 启动开发模式（会启动前端 dev server 并打开 GUI）
npm run dev
```

### 构建

```bash
cd apps/desktop
npm run build
```

### 运行测试

```bash
# 运行 disk-scanner 核心功能测试
cargo test -p ai-disk-scanner
```

## UI 设计

采用「工业集成」风格，基于 `docs/ui-spec.md` 规范：

- **主色** `#FFD200` - 能量流、激活态
- **底壳** `#2A2A2A` - 工业黑灰基底
- **副色** `#B2E600` - 成功/就绪
- **文字** `#E0E0E0` - 主阅读色
- **分割** `#5C5C5C` - 结构线条

## 技术栈

- **桌面框架**: Tauri 2
- **前端**: React 19 + TypeScript + Vite + TailwindCSS
- **后端**: Rust (workspace 多 crate 架构)
