# 发布指南

本文档说明如何构建和发布 DiskRookie 的新版本。

## 发布流程

### 1. 准备工作

确保以下内容已更新：
- `apps/desktop/package.json` 中的版本号
- `apps/desktop/src-tauri/tauri.conf.json` 中的版本号
- `apps/desktop/src-tauri/Cargo.toml` 中的版本号

### 2. 创建 Git Tag

```bash
# 确保所有更改已提交
git add .
git commit -m "准备发布 v0.1.0"

# 创建并推送标签
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```

### 3. 自动构建和发布

推送标签后，GitHub Actions 会自动：
1. 构建 Windows x86_64 版本（`.msi` 或 `.exe`）
2. 构建 macOS ARM64 版本（`.dmg`）
3. 创建 GitHub Release 并上传构建产物

### 4. 手动触发（可选）

如果需要手动触发构建：
1. 前往 GitHub Actions 页面
2. 选择 "Build and Release" 工作流
3. 点击 "Run workflow"
4. 输入版本标签（如 `v0.1.0`）

## 本地构建

### Windows x86_64

```bash
cd apps/desktop
npm install
npm run frontend:build
npx tauri build --target x86_64-pc-windows-msvc
```

构建产物位于：`apps/desktop/src-tauri/target/x86_64-pc-windows-msvc/release/bundle/`

### macOS ARM64

```bash
cd apps/desktop
npm install
npm run frontend:build
npx tauri build --target aarch64-apple-darwin
```

构建产物位于：`apps/desktop/src-tauri/target/aarch64-apple-darwin/release/bundle/`

## 版本号规范

遵循 [语义化版本](https://semver.org/)：
- **主版本号**：不兼容的 API 修改
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正

示例：`v0.1.0` → `v0.1.1` → `v0.2.0` → `v1.0.0`

## 注意事项

1. **代码签名**：如需代码签名，需要在 GitHub Secrets 中配置：
   - `TAURI_PRIVATE_KEY`: Tauri 私钥
   - `TAURI_KEY_PASSWORD`: 私钥密码

2. **构建时间**：完整构建可能需要 10-20 分钟，请耐心等待

3. **发布检查**：发布前请确保：
   - 所有测试通过
   - 文档已更新
   - 变更日志已更新
