/// 应用配置
#[derive(Debug, Clone, Default)]
pub struct AppConfig {
    pub scan_depth: Option<usize>,
    pub dry_run: bool,
}
