import { useState, useCallback, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { open } from '@tauri-apps/plugin-dialog'
import { Folder, Loader2, Clock, FileStack, HardDrive } from 'lucide-react'
import { Treemap, type TreemapNode } from './Treemap'
import { formatBytes, formatDuration } from '../utils/format'

interface ScanResult {
    root: TreemapNode
    scan_time_ms: number
    file_count: number
    total_size: number
}

export function ExpertMode() {
    const [path, setPath] = useState('C:\\')
    const [status, setStatus] = useState<'idle' | 'scanning' | 'done' | 'error'>('idle')
    const [errorMsg, setErrorMsg] = useState('')
    const [result, setResult] = useState<ScanResult | null>(null)
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
    const [hoverNode, setHoverNode] = useState<TreemapNode | null>(null)
    const [progressFiles, setProgressFiles] = useState(0)

    const checkAdmin = useCallback(async () => {
        try {
            const ok = await invoke<boolean>('check_admin_permission')
            setIsAdmin(ok)
            return ok
        } catch {
            setIsAdmin(false)
            return false
        }
    }, [])

    useEffect(() => {
        let unlisten: (() => void) | undefined
        const win = getCurrentWindow()
        win
            .listen<[number, string]>('scan-progress', (e) => {
                setProgressFiles(e.payload[0])
            })
            .then((fn) => {
                unlisten = fn
            })
        return () => {
            unlisten?.()
        }
    }, [])

    const runScan = useCallback(
        async (targetPath: string) => {
            setStatus('scanning')
            setErrorMsg('')
            setResult(null)
            setProgressFiles(0)
            await checkAdmin()
            try {
                const res = await invoke<ScanResult>('scan_path_command', { path: targetPath })
                setResult(res)
                setStatus('done')
                setProgressFiles(0)
            } catch (e) {
                setStatus('error')
                const err = String(e)
                setErrorMsg(
                    err.includes('Permission') || err.includes('权限')
                        ? '访问被拒绝。请以管理员身份运行后重试。'
                        : err
                )
            }
        },
        [checkAdmin]
    )

    const handleBrowseFolder = useCallback(async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: '选择要分析的文件夹',
            })
            if (selected) {
                const pathStr = typeof selected === 'string' ? selected : selected[0] ?? ''
                if (pathStr) {
                    setPath(pathStr)
                    await runScan(pathStr)
                }
            }
        } catch (e) {
            console.error('Folder picker error:', e)
        }
    }, [runScan])

    const handleScan = async () => {
        await runScan(path)
    }

    useEffect(() => {
        checkAdmin()
    }, [checkAdmin])

    return (
        <div className="flex flex-col h-full gap-5 text-text-main font-sans">
          
          {/* 扫描控制区：极简长条布局 */}
          <div className="flex items-stretch gap-0 bg-sub border border-muted/20">
            {/* 侧边功能标识色块 */}
            <div className="w-1.5 bg-primary shadow-[0_0_10px_rgba(255,210,0,0.3)]"></div>
            
            <div className="flex flex-1 items-center gap-4 p-2 pl-4">
              <button
                onClick={handleBrowseFolder}
                className="group p-2 hover:bg-white/5 transition-colors"
                title="选择路径"
              >
                <Folder className="w-5 h-5 text-primary" />
              </button>
      
              <div className="flex-1 flex flex-col">
                <span className="text-[10px] text-muted tracking-widest font-bold">目标路径</span>
                <input
                  type="text"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="请选择或输入扫描路径..."
                  className="bg-transparent border-none p-0 text-sm font-mono focus:ring-0 placeholder:text-muted/40"
                />
              </div>
      
              <button
                onClick={handleScan}
                disabled={status === 'scanning'}
                className="relative h-full px-10 bg-primary text-secondary font-bold text-sm [clip-path:polygon(10%_0,100%_0,100%_100%,0_100%)] hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {status === 'scanning' ? '执行中...' : '开始扫描'}
              </button>
            </div>
          </div>
      
          {/* 扫描状态：呼吸感分段进度 */}
          {status === 'scanning' && (
            <div className="bg-sub/50 p-4 border-l border-primary/30">
              <div className="flex justify-between items-end mb-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted tracking-tighter">实时数据流</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-2xl text-primary leading-none">{progressFiles.toLocaleString()}</span>
                    <span className="text-xs text-muted">已处理文件</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <span className="w-1 h-1 bg-primary animate-pulse"></span>
                  <span className="w-1 h-1 bg-primary animate-pulse delay-75"></span>
                  <span className="w-1 h-1 bg-primary animate-pulse delay-150"></span>
                </div>
              </div>
              
              <div className="flex gap-1 h-1">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="flex-1 bg-white/5 overflow-hidden">
                    <div
                      className="h-full w-full bg-primary animate-breath"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
      
          {/* 数据指标：去掉了图标，改用更纯粹的文字排版 */}
          {result && (
            <div className="grid grid-cols-3 gap-0 border border-muted/10">
              {[
                { label: '耗时', val: formatDuration(result.scan_time_ms) },
                { label: '文件总量', val: result.file_count.toLocaleString() },
                { label: '存储占用', val: formatBytes(result.total_size) }
              ].map((item, idx) => (
                <div key={idx} className={`p-4 bg-sub/30 ${idx !== 2 ? 'border-r border-muted/10' : ''}`}>
                  <p className="text-[10px] text-muted mb-1 font-bold">{item.label}</p>
                  <p className="font-mono text-xl font-medium text-white/90 leading-none">{item.val}</p>
                </div>
              ))}
            </div>
          )}
      
          {/* 核心可视化：极简方块地图 */}
          {result && (
            <div className="flex-1 min-h-[400px] flex flex-col bg-sub/20 border border-muted/10">
              <div className="flex justify-between items-center p-3 border-b border-muted/5 bg-white/5">
                <span className="text-[10px] text-muted tracking-widest font-bold">空间占用结构图</span>
                {hoverNode ? (
                  <div className="flex gap-4 font-mono text-[10px]">
                    <span className="text-primary">{hoverNode.name}</span>
                    <span className="text-muted">{formatBytes(hoverNode.size)}</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-muted/30 font-mono">就绪</span>
                )}
              </div>
      
              <div className="flex-1 p-2">
                {result.file_count === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted/40 text-xs tracking-widest">
                    未检测到有效存储数据
                  </div>
                ) : (
                  <div className="w-full h-full opacity-80 hover:opacity-100 transition-opacity">
                    <Treemap
                      root={result.root}
                      width={800}
                      height={400}
                      onHover={setHoverNode}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
      
          {/* 初始状态 */}
          {status === 'idle' && !result && (
            <div className="flex-1 flex flex-col items-center justify-center border border-muted/5 opacity-20">
              <div className="text-[10px] tracking-[0.5em] mb-2 uppercase">等待指令</div>
              <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-muted to-transparent"></div>
            </div>
          )}
        </div>
      );
}
