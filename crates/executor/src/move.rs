use ai_disk_common::DiskAnalyzerError;

/// 移动执行（预留）
pub async fn move_file(from: &str, to: &str) -> Result<(), DiskAnalyzerError> {
    let _ = (from, to);
    Ok(())
}
