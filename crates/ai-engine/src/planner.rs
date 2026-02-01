use ai_disk_domain::CleanupPlan;

/// AI 规划器（预留）
pub async fn plan_cleanup(_scan_result: &str) -> Result<CleanupPlan, String> {
    Ok(CleanupPlan {
        actions: vec![],
        estimated_space: 0,
    })
}
