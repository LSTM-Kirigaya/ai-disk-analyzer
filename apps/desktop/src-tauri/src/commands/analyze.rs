#[tauri::command]
pub async fn analyze_disk(path: String) -> Result<String, String> {
    let _ = path;
    Ok(r#"{"status":"ok","message":"分析功能待实现"}"#.to_string())
}
