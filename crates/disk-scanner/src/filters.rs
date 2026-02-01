/// 扫描过滤器（预留）
pub struct ScanFilters {
    pub exclude_patterns: Vec<String>,
    pub max_depth: Option<usize>,
}

impl Default for ScanFilters {
    fn default() -> Self {
        Self {
            exclude_patterns: vec![],
            max_depth: None,
        }
    }
}
