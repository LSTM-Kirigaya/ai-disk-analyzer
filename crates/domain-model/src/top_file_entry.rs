use serde::{Deserialize, Serialize};

/// 按大小排序的前 N 大文件条目，用于前端摘要与 AI 分析，避免遍历整棵树
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TopFileEntry {
    pub path: String,
    pub size: u64,
    /// Unix 时间戳（秒），最近修改时间
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub modified: Option<u64>,
}
