use std::path::Path;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Instant;

use ai_disk_common::DiskAnalyzerError;
use ai_disk_domain::{FileNode, ScanResult};
use rayon::prelude::*;

const MAX_DEPTH: usize = 10;
const MAX_CHILDREN_PER_DIR: usize = 500;

type ProgressCb = Box<dyn Fn(u64, &str) + Send + Sync>;

fn build_tree(
    path: &Path,
    name: &str,
    depth: usize,
    counter: &AtomicU64,
    progress: Option<&ProgressCb>,
) -> Result<(FileNode, u64), DiskAnalyzerError> {
    let metadata = std::fs::metadata(path).map_err(|e| {
        if e.kind() == std::io::ErrorKind::PermissionDenied {
            DiskAnalyzerError::PermissionDenied(path.display().to_string())
        } else {
            DiskAnalyzerError::Io(e)
        }
    })?;

    let is_dir = metadata.is_dir();
    let mut size = if is_dir { 0u64 } else { metadata.len() };
    let mut file_count = if is_dir { 0u64 } else { 1u64 };
    let mut children = Vec::new();

    if is_dir && depth < MAX_DEPTH {
        let mut entries: Vec<_> = std::fs::read_dir(path).map_err(|e| {
            if e.kind() == std::io::ErrorKind::PermissionDenied {
                DiskAnalyzerError::PermissionDenied(path.display().to_string())
            } else {
                DiskAnalyzerError::Io(e)
            }
        })?
        .filter_map(|e| e.ok())
        .collect();

        entries.sort_by(|a, b| {
            let a_is_dir = a.path().is_dir();
            let b_is_dir = b.path().is_dir();
            match (a_is_dir, b_is_dir) {
                (true, false) => std::cmp::Ordering::Less,
                (false, true) => std::cmp::Ordering::Greater,
                _ => a.file_name().cmp(&b.file_name()),
            }
        });

        let entries: Vec<_> = entries.into_iter().take(MAX_CHILDREN_PER_DIR).collect();

        // 并行处理子项
        let results: Vec<_> = entries
            .par_iter()
            .map(|entry| {
                let child_path = entry.path();
                let child_name = entry.file_name().to_string_lossy().to_string();
                match build_tree(&child_path, &child_name, depth + 1, counter, progress) {
                    Ok((node, cnt)) => Ok((node, cnt)),
                    Err(DiskAnalyzerError::PermissionDenied(_)) => Ok((
                        FileNode {
                            path: child_path.display().to_string(),
                            name: format!("{} [无权限]", child_name),
                            size: 0,
                            is_dir: child_path.is_dir(),
                            children: vec![],
                        },
                        0u64,
                    )),
                    Err(e) => Err(e),
                }
            })
            .collect();

        for r in results {
            let (node, cnt) = r?;
            size += node.size;
            file_count += cnt;
            children.push(node);
        }

        counter.fetch_add(file_count, Ordering::Relaxed);
        if let Some(ref cb) = progress {
            let total_so_far = counter.load(Ordering::Relaxed);
            cb(total_so_far, path.display().to_string().as_str());
        }
    }

    Ok((
        FileNode {
            path: path.display().to_string(),
            name: name.to_string(),
            size,
            is_dir,
            children,
        },
        file_count,
    ))
}

/// 规范化路径（支持正斜杠、去除首尾空白）
fn normalize_path(path: &str) -> std::path::PathBuf {
    let s = path.trim();
    #[cfg(windows)]
    let s = s.replace('/', "\\");
    std::path::PathBuf::from(s)
}

/// 执行磁盘扫描（支持进度回调）
pub fn scan_path_with_progress(
    path: &str,
    progress: Option<ProgressCb>,
) -> Result<ScanResult, DiskAnalyzerError> {
    let start = Instant::now();
    let path_buf = normalize_path(path);

    if !path_buf.exists() {
        return Err(DiskAnalyzerError::InvalidPath(format!("路径不存在: {}", path)));
    }

    let path_buf = std::fs::canonicalize(&path_buf)
        .map_err(|e| DiskAnalyzerError::InvalidPath(format!("无法解析路径: {}", e)))?;

    let name = path_buf
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or(path)
        .to_string();

    let counter = AtomicU64::new(0);
    let (root, file_count) =
        build_tree(&path_buf, &name, 0, &counter, progress.as_ref())?;
    let scan_time_ms = start.elapsed().as_millis() as u64;
    let total_size = root.size;

    Ok(ScanResult {
        root,
        scan_time_ms,
        file_count,
        total_size,
    })
}

/// 执行磁盘扫描（无进度）
pub fn scan_path(path: &str) -> Result<ScanResult, DiskAnalyzerError> {
    scan_path_with_progress(path, None)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::{self, File};
    use std::io::Write;

    fn create_test_dir() -> (tempfile::TempDir, String) {
        let dir = tempfile::tempdir().expect("create temp dir");
        let path = dir.path().to_string_lossy().to_string();
        let sub = dir.path().join("subdir");
        fs::create_dir_all(&sub).unwrap();
        File::create(sub.join("a.txt")).unwrap().write_all(b"hello").unwrap();
        File::create(dir.path().join("b.txt")).unwrap().write_all(b"world").unwrap();
        (dir, path)
    }

    #[test]
    fn test_normalize_path() {
        let pb = normalize_path("  /a/b/c  ");
        #[cfg(windows)]
        assert!(pb.to_string_lossy().contains('\\') || pb.to_string_lossy().contains('/'));
        #[cfg(not(windows))]
        assert!(pb.to_string_lossy().contains('/'));
    }

    #[test]
    fn test_scan_invalid_path() {
        let err = scan_path("/nonexistent/path/12345").unwrap_err();
        assert!(matches!(err, DiskAnalyzerError::InvalidPath(_)));
    }

    #[test]
    fn test_scan_nonexistent_path() {
        #[cfg(windows)]
        let bad_path = "C:\\nonexistent_xyz_12345_folder";
        #[cfg(not(windows))]
        let bad_path = "/nonexistent_xyz_12345_folder";
        let err = scan_path(bad_path).unwrap_err();
        assert!(matches!(err, DiskAnalyzerError::InvalidPath(_)));
    }

    #[test]
    fn test_scan_temp_dir() {
        let (_guard, path) = create_test_dir();
        let result = scan_path(&path).unwrap();
        assert!(result.file_count >= 2);
        assert!(result.total_size >= 10);
        assert!(result.scan_time_ms >= 0);
        assert!(!result.root.children.is_empty());
    }

    #[test]
    #[cfg(windows)]
    fn test_scan_academic_path() {
        let path = "C:\\Users\\K\\Academic";
        if std::path::Path::new(path).exists() {
            let result = scan_path(path).unwrap();
            assert!(result.root.name == "Academic" || !result.root.path.is_empty());
        }
    }
}
