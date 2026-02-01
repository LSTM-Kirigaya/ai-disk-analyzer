use ai_disk_domain::ScanResult;
use ai_disk_scanner::scan_path_with_progress;
use tauri::{async_runtime, Emitter, Window};

#[tauri::command]
pub async fn scan_path_command(window: Window, path: String) -> Result<ScanResult, String> {
    let path_trimmed = path.trim().to_string();
    let path_clone = path_trimmed.clone();
    let progress = Box::new(move |count: u64, path_str: &str| {
        let _ = window.emit("scan-progress", (count, path_str.to_string()));
    });
    async_runtime::spawn_blocking(move || scan_path_with_progress(&path_clone, Some(progress)))
        .await
        .map_err(|e| e.to_string())?
        .map_err(|e| e.to_string())
}
