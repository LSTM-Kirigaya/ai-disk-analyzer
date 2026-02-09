// 安全名单：名单中的路径不会出现在发给 AI 的 system prompt 文件表格中
import { readJSON, writeJSON } from './storage'

const SAFE_LIST_FILE = 'safe-list-paths.json'

/** 规范化路径便于比较（统一斜杠、去除末尾分隔符等） */
export function normalizePathForCompare(p: string): string {
  const s = p.trim().replace(/\//g, '\\')
  // 统一去掉末尾的 \（除 C:\ 这类卷根外）
  if (s.length > 2 && s.endsWith('\\')) return s.slice(0, -1)
  return s
}

/** 判断路径是否在安全名单中（精确匹配或路径位于名单项目录下） */
export function isPathInSafeList(path: string, safeList: string[]): boolean {
  const normalized = normalizePathForCompare(path)
  return safeList.some((safe) => {
    const n = normalizePathForCompare(safe)
    return normalized === n || normalized.startsWith(n + '\\')
  })
}

export async function loadSafeListPaths(): Promise<string[]> {
  const list = await readJSON<string[]>(SAFE_LIST_FILE, [])
  return Array.isArray(list) ? list : []
}

export async function saveSafeListPaths(paths: string[]): Promise<void> {
  await writeJSON(SAFE_LIST_FILE, paths)
}

export async function addToSafeList(path: string): Promise<void> {
  const list = await loadSafeListPaths()
  const n = normalizePathForCompare(path)
  if (list.some((p) => normalizePathForCompare(p) === n)) return
  list.push(path)
  await saveSafeListPaths(list)
}

export async function removeFromSafeList(path: string): Promise<void> {
  const list = await loadSafeListPaths()
  const n = normalizePathForCompare(path)
  const next = list.filter((p) => normalizePathForCompare(p) !== n)
  if (next.length === list.length) return
  await saveSafeListPaths(next)
}
