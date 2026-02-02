![应用图标](apps/desktop/app-icon.png)

# AI 磁盘分析工具 (AI Disk Analyzer)

基于 AI 的智能磁盘分析与整理工具，帮助用户快速整理磁盘上的无用文件，对冷数据提供迁移方案与建议。

## 项目架构

```
ai-disk-analyzer/
├── apps/
│   ├── desktop/                 # GUI App（Tauri）
│   │   ├── app-icon.png         # 应用图标（1024x1024，带圆角）
│   │   ├── src-tauri/           # Rust 后端
│   │   │   ├── src/
│   │   │   │   ├── commands/    # GUI ↔ Core 桥接
│   │   │   │   ├── main.rs
│   │   │   │   └── lib.rs
│   │   │   ├── icons/           # 多平台图标文件（自动生成）
│   │   │   └── Cargo.toml
│   │   └── frontend/            # React + Vite + TailwindCSS
│   └── images/                  # 图标资源
│       ├── new_icon.png         # 原始图标设计
│       └── generate_rounded_icon.py  # 图标生成脚本
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

## 开发计划

- [ ] 支持更多文件类型识别
- [ ] 增加文件预览功能
- [ ] 支持自定义清理规则
- [ ] 多语言支持
- [ ] 云端同步清理历史

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

本项目采用 [Apache License 2.0](LICENSE) 许可证。

Copyright 2025 AI Disk Analyzer Contributors