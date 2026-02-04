// 应用设置服务
import { readJSON, writeJSON } from './storage'

export interface AppSettings {
  promptFileCount: number  // AI Prompt 中显示的文件数量
}

const SETTINGS_FILE = 'app-settings.json'

export const DEFAULT_APP_SETTINGS: AppSettings = {
  promptFileCount: 100,
}

// 加载设置
export async function loadAppSettings(): Promise<AppSettings> {
  return await readJSON<AppSettings>(SETTINGS_FILE, DEFAULT_APP_SETTINGS)
}

// 保存设置
export async function saveAppSettings(settings: AppSettings): Promise<void> {
  await writeJSON(SETTINGS_FILE, settings)
}
