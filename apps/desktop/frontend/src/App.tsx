import { getCurrentWindow } from '@tauri-apps/api/window'
import { ExpertMode } from './components/ExpertMode'

function App() {
  const win = getCurrentWindow()

  const handleTitleBarMouseDown = () => {
    win.startDragging()
  }

  return (
    <div className="min-h-screen bg-sub text-text-main flex flex-col">
      {/* 自定义菜单栏：拖拽区 + 标题 + 最小化/最大化/关闭 */}
      <header className="shrink-0 h-9 flex items-center border-b border-muted select-none">
        <div
          data-tauri-drag-region
          onMouseDown={handleTitleBarMouseDown}
          className="flex-1 flex items-center px-3 h-full cursor-move"
        >
          <span className="text-sm font-medium text-text-main">AI 磁盘分析工具</span>
        </div>
        <div className="flex h-full">
          <button
            type="button"
            onClick={() => win.minimize()}
            className="h-full w-12 flex items-center justify-center text-muted hover:bg-white/10 hover:text-text-main transition-colors"
            title="最小化"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => win.toggleMaximize()}
            className="h-full w-12 flex items-center justify-center text-muted hover:bg-white/10 hover:text-text-main transition-colors"
            title="最大化 / 还原"
          >
            □
          </button>
          <button
            type="button"
            onClick={() => win.close()}
            className="h-full w-12 flex items-center justify-center text-muted hover:bg-red-500/80 hover:text-white transition-colors"
            title="关闭"
          >
            ✕
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 bg-sub">
        <ExpertMode />
      </main>
    </div>
  )
}

export default App
