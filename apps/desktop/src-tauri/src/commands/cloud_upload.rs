use serde::{Deserialize, Serialize};
use std::path::Path;
use reqwest;

#[derive(Debug, Serialize, Deserialize)]
pub struct UploadConfig {
    pub provider: String,
    pub name: String,
    pub access_token: String,
    pub target_path: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UploadResult {
    pub success: bool,
    pub provider: String,
    pub file_id: Option<String>,
    pub message: String,
}

/// 上传文件到云存储
#[tauri::command]
pub async fn upload_to_cloud(
    file_path: String,
    configs: Vec<UploadConfig>,
) -> Result<Vec<UploadResult>, String> {
    let mut results = Vec::new();
    
    for config in configs {
        let result = match config.provider.as_str() {
            "google_drive" => upload_to_google_drive(&file_path, &config).await,
            _ => Err(format!("不支持的云存储提供商: {}", config.provider)),
        };
        
        results.push(match result {
            Ok(file_id) => UploadResult {
                success: true,
                provider: config.provider.clone(),
                file_id: Some(file_id),
                message: format!("成功上传到 {}", config.name),
            },
            Err(e) => UploadResult {
                success: false,
                provider: config.provider.clone(),
                file_id: None,
                message: format!("上传失败: {}", e),
            },
        });
    }
    
    Ok(results)
}

/// 上传文件到 Google Drive
async fn upload_to_google_drive(
    file_path: &str,
    config: &UploadConfig,
) -> Result<String, String> {
    let path = Path::new(file_path);
    
    // 检查文件是否存在
    if !path.exists() {
        return Err(format!("文件不存在: {}", file_path));
    }
    
    // 获取文件名
    let file_name = path
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| "无法获取文件名".to_string())?;
    
    // 读取文件内容
    let file_content = std::fs::read(path)
        .map_err(|e| format!("读取文件失败: {}", e))?;
    
    // 第一步：获取或创建目标文件夹
    let folder_id = if config.target_path == "/" {
        "root".to_string()
    } else {
        create_or_get_folder(&config.access_token, &config.target_path).await?
    };
    
    // 第二步：创建文件元数据
    let metadata = serde_json::json!({
        "name": file_name,
        "parents": [folder_id]
    });
    
    // 第三步：使用 multipart 上传文件
    let client = reqwest::Client::new();
    let boundary = "==boundary==";
    
    let mut body = Vec::new();
    
    // 元数据部分
    body.extend_from_slice(format!("--{}\r\n", boundary).as_bytes());
    body.extend_from_slice(b"Content-Type: application/json; charset=UTF-8\r\n\r\n");
    body.extend_from_slice(metadata.to_string().as_bytes());
    body.extend_from_slice(b"\r\n");
    
    // 文件内容部分
    body.extend_from_slice(format!("--{}\r\n", boundary).as_bytes());
    body.extend_from_slice(b"Content-Type: application/octet-stream\r\n\r\n");
    body.extend_from_slice(&file_content);
    body.extend_from_slice(b"\r\n");
    body.extend_from_slice(format!("--{}--\r\n", boundary).as_bytes());
    
    let response = client
        .post("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart")
        .header("Authorization", format!("Bearer {}", config.access_token))
        .header("Content-Type", format!("multipart/related; boundary={}", boundary))
        .body(body)
        .send()
        .await
        .map_err(|e| format!("上传请求失败: {}", e))?;
    
    let status = response.status();
    if !status.is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("上传失败 ({}): {}", status, error_text));
    }
    
    let result: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;
    
    let file_id = result["id"]
        .as_str()
        .ok_or_else(|| "响应中没有文件 ID".to_string())?
        .to_string();
    
    Ok(file_id)
}

/// 创建或获取文件夹
async fn create_or_get_folder(
    access_token: &str,
    path: &str,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    
    // 分割路径
    let parts: Vec<&str> = path
        .trim_matches('/')
        .split('/')
        .filter(|p| !p.is_empty())
        .collect();
    
    let mut parent_id = "root".to_string();
    
    // 逐级创建或查找文件夹
    for folder_name in parts {
        // 查找是否已存在
        let query = format!(
            "name='{}' and '{}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false",
            folder_name, parent_id
        );
        
        let search_url = format!(
            "https://www.googleapis.com/drive/v3/files?q={}&fields=files(id)",
            urlencoding::encode(&query)
        );
        
        let response = client
            .get(&search_url)
            .header("Authorization", format!("Bearer {}", access_token))
            .send()
            .await
            .map_err(|e| format!("查询文件夹失败: {}", e))?;
        
        if !response.status().is_success() {
            return Err(format!("查询文件夹失败: {}", response.status()));
        }
        
        let result: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("解析查询响应失败: {}", e))?;
        
        // 如果找到了，使用现有的
        if let Some(files) = result["files"].as_array() {
            if !files.is_empty() {
                parent_id = files[0]["id"]
                    .as_str()
                    .ok_or_else(|| "无效的文件夹 ID".to_string())?
                    .to_string();
                continue;
            }
        }
        
        // 没找到，创建新文件夹
        let metadata = serde_json::json!({
            "name": folder_name,
            "mimeType": "application/vnd.google-apps.folder",
            "parents": [parent_id]
        });
        
        let response = client
            .post("https://www.googleapis.com/drive/v3/files")
            .header("Authorization", format!("Bearer {}", access_token))
            .header("Content-Type", "application/json")
            .json(&metadata)
            .send()
            .await
            .map_err(|e| format!("创建文件夹失败: {}", e))?;
        
        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("创建文件夹失败: {}", error_text));
        }
        
        let result: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("解析创建响应失败: {}", e))?;
        
        parent_id = result["id"]
            .as_str()
            .ok_or_else(|| "创建的文件夹没有 ID".to_string())?
            .to_string();
    }
    
    Ok(parent_id)
}
