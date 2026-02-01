/// 检测当前进程是否以管理员权限运行（Windows）
#[tauri::command]
pub fn check_admin_permission() -> bool {
    #[cfg(windows)]
    {
        is_elevated::is_elevated()
    }

    #[cfg(not(windows))]
    {
        true
    }
}
