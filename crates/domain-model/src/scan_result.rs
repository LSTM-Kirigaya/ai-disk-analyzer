use serde::{Deserialize, Serialize};

use crate::FileNode;

/// 扫描结果，包含树结构与各项指标
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    pub root: FileNode,
    pub scan_time_ms: u64,
    pub file_count: u64,
    pub total_size: u64,
}
