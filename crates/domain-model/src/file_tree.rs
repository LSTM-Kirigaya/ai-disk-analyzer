use serde::{Deserialize, Serialize};

/// 文件树节点
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileNode {
    pub path: String,
    pub name: String,
    pub size: u64,
    pub is_dir: bool,
    #[serde(default)]
    pub children: Vec<FileNode>,
}
