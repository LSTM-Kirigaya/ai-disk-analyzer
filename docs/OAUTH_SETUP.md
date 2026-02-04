# Google Drive OAuth 配置指南

## 概述

本应用已实现 Google Drive 的 OAuth 2.0 授权流程，用户无需手动填写 Client ID 和 Client Secret，只需点击登录按钮即可完成授权。

## 实现原理

- **PKCE (Proof Key for Code Exchange)**: 使用 PKCE 流程增强安全性，适合桌面应用
- **本地回调服务器**: 在随机端口启动临时 HTTP 服务器接收 OAuth 回调
- **自动浏览器打开**: 使用系统默认浏览器打开 Google 授权页面
- **Token 管理**: 自动管理 access token 和 refresh token，并在过期前自动刷新

## 配置步骤

### 1. 创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 在项目中启用 **Google Drive API**

### 2. 创建 OAuth 2.0 凭据

1. 进入 **APIs & Services > Credentials**
2. 点击 **Create Credentials > OAuth client ID**
3. 选择应用类型：**Desktop app**
4. 为 OAuth 客户端命名（例如：DiskRookie Desktop）
5. 点击 **Create**

### 3. 配置 OAuth 客户端

由于桌面应用使用 loopback redirect，Google 会自动配置 `http://127.0.0.1` 作为重定向 URI。

**重要提示**：
- 确保选择 "Desktop app" 类型（不是 Web application）
- Desktop app 类型不需要配置 redirect URI
- 应用会在随机端口（49152-65535）启动本地服务器

### 4. 更新应用配置

将创建的 Client ID 更新到代码中：

打开文件：`apps/desktop/src-tauri/src/commands/oauth.rs`

```rust
// 找到这一行并替换为你的 Client ID
const GOOGLE_CLIENT_ID: &str = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
```

**注意**：
- 桌面应用的 Client Secret 是可选的（Google 不强制要求）
- 当前实现使用公开客户端流程（不需要 Client Secret）

### 5. 配置 OAuth 同意屏幕

1. 在 Google Cloud Console 中进入 **APIs & Services > OAuth consent screen**
2. 选择用户类型：
   - **Internal**: 仅限组织内用户（需要 Google Workspace）
   - **External**: 任何 Google 账号用户
3. 填写应用信息：
   - 应用名称
   - 用户支持电子邮件
   - 开发者联系信息
4. 添加必要的权限范围（Scopes）：
   - `https://www.googleapis.com/auth/drive.file` - 管理应用创建的文件
   - `https://www.googleapis.com/auth/userinfo.email` - 查看用户邮箱
   - `https://www.googleapis.com/auth/userinfo.profile` - 查看用户资料

### 6. 测试用户配置（开发阶段）

如果应用处于"Testing"状态：
1. 在 **OAuth consent screen** 页面添加测试用户
2. 输入要测试的 Google 账号邮箱
3. 这些用户将能够授权应用访问他们的数据

### 7. 发布应用（生产环境）

开发完成后，提交应用进行 Google 审核：
1. 在 **OAuth consent screen** 页面点击 **Publish app**
2. 如果使用敏感或受限权限，需要通过 Google 审核
3. 审核通过后，任何 Google 用户都可以使用

## 使用流程

### 用户视角

1. 在应用中点击 "添加云存储" 按钮
2. 选择 "Google Drive"
3. 点击 "使用 Google Drive 登录" 按钮
4. 浏览器自动打开 Google 授权页面
5. 登录 Google 账号并授予权限
6. 授权成功后，浏览器显示成功消息，可关闭窗口
7. 返回应用，显示已连接的账号信息
8. 配置目标文件夹后保存

### 技术流程

```
1. 用户点击登录
   ↓
2. 生成 code_verifier 和 code_challenge (PKCE)
   ↓
3. 启动本地回调服务器（随机端口）
   ↓
4. 打开浏览器到 Google 授权 URL
   ↓
5. 用户在浏览器中登录并授权
   ↓
6. Google 重定向到 http://127.0.0.1:PORT?code=xxx
   ↓
7. 本地服务器接收回调，获取授权码
   ↓
8. 使用授权码 + code_verifier 交换 token
   ↓
9. 获取 access_token 和 refresh_token
   ↓
10. 获取用户信息（邮箱、名称、头像）
   ↓
11. 保存配置到本地存储
```

## 安全考虑

### PKCE 流程
- 每次授权生成随机的 `code_verifier`（64 字符）
- 使用 SHA256 计算 `code_challenge`
- 防止授权码拦截攻击

### State 参数
- 每次请求生成随机 `state`（32 字符）
- 回调时验证 `state` 匹配，防止 CSRF 攻击

### Token 存储
- Access token 和 refresh token 存储在应用本地
- 使用 Tauri 的安全存储机制
- Token 过期前自动刷新

### 端口随机化
- 回调服务器使用随机端口（49152-65535）
- 避免端口冲突
- 每次授权使用不同端口

## 故障排查

### 授权失败

**问题**：点击登录后浏览器打开但授权失败

**解决方案**：
1. 检查 Client ID 是否正确配置
2. 确认应用类型是 "Desktop app"
3. 查看浏览器中的错误信息
4. 检查 OAuth 同意屏幕配置是否完整

### 超时错误

**问题**：等待授权超时（5 分钟）

**解决方案**：
1. 在浏览器中更快地完成授权
2. 检查网络连接
3. 确认防火墙未阻止本地端口

### redirect_uri_mismatch 错误

**问题**：Google 返回 redirect URI 不匹配错误

**解决方案**：
1. 确保创建的是 "Desktop app" 类型客户端
2. Desktop app 会自动配置 loopback 重定向
3. 不要手动添加 redirect URI

### Token 刷新失败

**问题**：已授权但无法刷新 token

**解决方案**：
1. 检查 refresh_token 是否正确保存
2. 确认授权时请求了 `access_type=offline`
3. 重新授权以获取新的 refresh token

## 开发注意事项

### Client ID 配置

**方式 1：硬编码（当前实现）**
```rust
const GOOGLE_CLIENT_ID: &str = "YOUR_CLIENT_ID.apps.googleusercontent.com";
```

**方式 2：环境变量（推荐）**
```rust
const GOOGLE_CLIENT_ID: &str = env!("GOOGLE_CLIENT_ID");
```

然后在 `.cargo/config.toml` 中配置：
```toml
[env]
GOOGLE_CLIENT_ID = "your-client-id.apps.googleusercontent.com"
```

**方式 3：配置文件**
```rust
// 从配置文件读取
let client_id = read_config("google_client_id")?;
```

### Scope 配置

当前配置的权限：
```rust
const GOOGLE_DRIVE_SCOPE: &str = "https://www.googleapis.com/auth/drive.file";
```

如需访问所有文件，可以使用：
```rust
const GOOGLE_DRIVE_SCOPE: &str = "https://www.googleapis.com/auth/drive";
```

### 添加其他 OAuth 提供商

参考 Google Drive 实现，添加其他提供商：

1. 在 `oauth.rs` 中添加新的命令函数
2. 配置提供商的 OAuth 端点和 scope
3. 在前端 `settings.ts` 中添加对应的调用函数
4. 在 `CloudStorageSettings.tsx` 中更新 `OAUTH_PROVIDERS` 数组

## 相关资源

- [Google OAuth 2.0 for Desktop Apps](https://developers.google.com/identity/protocols/oauth2/native-app)
- [Google Drive API Documentation](https://developers.google.com/drive/api/guides/about-sdk)
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
- [OAuth 2.0 Security Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)

## 支持

如有问题，请查看：
1. 应用日志（Tauri devtools）
2. 浏览器控制台错误
3. Google Cloud Console 错误日志
