use serde::{Deserialize, Serialize};

use crate::action::Action;

/// 清理计划
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanupPlan {
    pub actions: Vec<Action>,
    pub estimated_space: u64,
}
