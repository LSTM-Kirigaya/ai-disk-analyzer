use serde::{Deserialize, Serialize};

/// 文件树节点
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileNode {
    pub path: String,
    pub name: String,
    pub size: u64,
    pub is_dir: bool,
    /// Unix 时间戳（秒），最近修改时间
    #[serde(default)]
    pub modified: Option<u64>,
    #[serde(default)]
    pub children: Vec<FileNode>,
}
