mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::scan::scan_path_command,
            commands::analyze::analyze_disk,
            commands::plan::get_cleanup_plan,
            commands::execute::execute_plan,
            commands::permission::check_admin_permission,
            commands::delete::delete_item,
            commands::storage::read_storage_file,
            commands::storage::write_storage_file,
            commands::storage::delete_storage_file,
            commands::storage::list_storage_files,
            commands::storage::get_storage_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
