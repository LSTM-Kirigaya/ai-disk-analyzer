use serde::{Deserialize, Serialize};

/// 执行动作
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Action {
    Delete { path: String },
    Move { from: String, to: String },
}
