use ai_disk_domain::CleanupPlan;

#[tauri::command]
pub async fn get_cleanup_plan(scan_result: String) -> Result<CleanupPlan, String> {
    ai_disk_engine::plan_cleanup(&scan_result).await
}
