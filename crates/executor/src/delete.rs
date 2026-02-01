use ai_disk_common::DiskAnalyzerError;

/// 删除执行（预留）
pub async fn delete_file(path: &str) -> Result<(), DiskAnalyzerError> {
    let _ = path;
    Ok(())
}
