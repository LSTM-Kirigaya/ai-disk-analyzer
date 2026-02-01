use ai_disk_domain::CleanupPlan;

#[tauri::command]
pub async fn execute_plan(plan: CleanupPlan, dry_run: bool) -> Result<String, String> {
    let _ = (plan, dry_run);
    Ok("执行功能待实现".to_string())
}
