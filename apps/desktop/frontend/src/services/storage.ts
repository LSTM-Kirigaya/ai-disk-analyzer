// 本地文件系统存储服务 - 使用 .disk-rookie 目录
import { invoke } from '@tauri-apps/api/core'

/**
 * 读取存储文件
 */
export async function readStorageFile(filename: string): Promise<string> {
  try {
    return await invoke<string>('read_storage_file', { filename })
  } catch (error) {
    console.error(`读取文件失败 ${filename}:`, error)
    return ''
  }
}

/**
 * 写入存储文件
 */
export async function writeStorageFile(filename: string, content: string): Promise<void> {
  try {
    await invoke('write_storage_file', { filename, content })
  } catch (error) {
    console.error(`写入文件失败 ${filename}:`, error)
    throw error
  }
}

/**
 * 删除存储文件
 */
export async function deleteStorageFile(filename: string): Promise<void> {
  try {
    await invoke('delete_storage_file', { filename })
  } catch (error) {
    console.error(`删除文件失败 ${filename}:`, error)
    throw error
  }
}

/**
 * 列出存储文件
 */
export async function listStorageFiles(subdir?: string): Promise<string[]> {
  try {
    return await invoke<string[]>('list_storage_files', { subdir })
  } catch (error) {
    console.error('列出文件失败:', error)
    return []
  }
}

/**
 * 获取存储根目录路径
 */
export async function getStoragePath(): Promise<string> {
  try {
    return await invoke<string>('get_storage_path')
  } catch (error) {
    console.error('获取存储路径失败:', error)
    return ''
  }
}

/**
 * 读取 JSON 文件
 */
export async function readJSON<T>(filename: string, defaultValue: T): Promise<T> {
  try {
    const content = await readStorageFile(filename)
    if (!content) return defaultValue
    return JSON.parse(content) as T
  } catch (error) {
    console.error(`读取 JSON 失败 ${filename}:`, error)
    return defaultValue
  }
}

/**
 * 写入 JSON 文件
 */
export async function writeJSON(filename: string, data: unknown): Promise<void> {
  const content = JSON.stringify(data, null, 2)
  await writeStorageFile(filename, content)
}
