import { useState, useEffect } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { open } from '@tauri-apps/plugin-shell'
import { Settings, Github, Mail, ExternalLink } from 'lucide-react'
import { ThemeProvider, createTheme, CssBaseline, Button, IconButton, Box, Tooltip } from '@mui/material'
import { ExpertMode } from './components/ExpertMode'
import { AISettings } from './components/AISettings'
import { AIChat } from './components/AIChat'

const theme = createTheme({
  palette: {
    primary: {
      main: '#FFD200',
    },
    secondary: {
      main: '#1A1A1A',
    },
    background: {
      default: '#FFFFFF',
      paper: '#F5F5F5',
    },
  },
  shape: {
    borderRadius: 12,
  },
})

function App() {
  const win = getCurrentWindow()
  const [showSettings, setShowSettings] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [platform, setPlatform] = useState<'macos' | 'windows' | 'linux'>('windows')

  useEffect(() => {
    const detectPlatform = () => {
      // 使用 navigator.platform 检测操作系统
      const platformName = navigator.platform.toLowerCase()
      const userAgent = navigator.userAgent.toLowerCase()
      
      if (platformName.includes('mac') || userAgent.includes('mac')) {
        setPlatform('macos')
      } else if (platformName.includes('win') || userAgent.includes('win')) {
        setPlatform('windows')
      } else {
        setPlatform('linux')
      }
    }
    detectPlatform()
  }, [])

  const handleTitleBarMouseDown = () => {
    win.startDragging()
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="min-h-screen bg-white text-text-main flex flex-col overflow-hidden" style={{ height: '100vh' }}>
      {/* 菜单栏固定顶部，向下滚动时始终可见 */}
      <header className={`sticky top-0 z-50 shrink-0 h-10 flex items-center border-b border-border bg-white select-none ${platform === 'macos' ? 'pl-16' : ''}`}>
        {/* macOS 窗口控制按钮（左上角） */}
        {platform === 'macos' && (
          <Box
            sx={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              gap: 0.5,
              alignItems: 'center',
              zIndex: 1000,
            }}
          >
            {/* 关闭按钮（红色） */}
            <Box
              component="button"
              onClick={() => win.close()}
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: '#ff5f57',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  bgcolor: '#ff3b30',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
              }}
              title="关闭"
            />
            {/* 最小化按钮（黄色） */}
            <Box
              component="button"
              onClick={() => win.minimize()}
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: '#ffbd2e',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  bgcolor: '#ff9500',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
              }}
              title="最小化"
            />
            {/* 全屏按钮（绿色） */}
            <Box
              component="button"
              onClick={() => win.toggleMaximize()}
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: '#28c840',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  bgcolor: '#1fb82e',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
              }}
              title="全屏"
            />
          </Box>
        )}

        <div
          data-tauri-drag-region
          onMouseDown={handleTitleBarMouseDown}
          className="flex-1 flex items-center px-4 h-full cursor-default"
        >
          <span className="text-sm font-semibold text-secondary">AI Disk Analyzer</span>
        </div>
        
        {/* 项目信息链接 */}
        <div className="flex items-center h-full px-2 gap-0.5 border-r border-border mr-1">
          <Tooltip title="GitHub 仓库" arrow>
            <IconButton
              size="small"
              onClick={() => open('https://github.com/LSTM-Kirigaya/ai-disk-analyzer')}
              sx={{
                width: '24px',
                height: '24px',
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: 'action.hover',
                  color: 'text.primary',
                },
              }}
            >
              <Github className="w-3.5 h-3.5" />
            </IconButton>
          </Tooltip>
          <Tooltip title="邮箱：zhelonghuang@qq.com" arrow>
            <IconButton
              size="small"
              onClick={() => open('mailto:zhelonghuang@qq.com')}
              sx={{
                width: '24px',
                height: '24px',
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: 'action.hover',
                  color: 'text.primary',
                },
              }}
            >
              <Mail className="w-3.5 h-3.5" />
            </IconButton>
          </Tooltip>
          <Tooltip title="个人主页" arrow>
            <IconButton
              size="small"
              onClick={() => open('https://kirigaya.cn/about')}
              sx={{
                width: '24px',
                height: '24px',
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: 'action.hover',
                  color: 'text.primary',
                },
              }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </IconButton>
          </Tooltip>
        </div>
        
        {/* 功能按钮 */}
        <div className="flex items-center h-full px-2 gap-1">
          <Button
            variant={showChat ? "contained" : "text"}
            size="small"
            onClick={() => setShowChat(!showChat)}
            sx={{
              minWidth: 'auto',
              height: '28px',
              px: 1.5,
              fontSize: '12px',
              textTransform: 'none',
              bgcolor: showChat ? 'primary.main' : 'transparent',
              color: showChat ? 'secondary.main' : 'text.secondary',
              '&:hover': {
                bgcolor: showChat ? 'primary.dark' : 'action.hover',
              },
            }}
          >
            AI 助手
          </Button>
          <IconButton
            size="small"
            onClick={() => setShowSettings(true)}
            title="设置"
            sx={{
              width: '28px',
              height: '28px',
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <Settings className="w-4 h-4" />
          </IconButton>
        </div>

        {/* Windows/Linux 窗口控制按钮（右上角） */}
        {platform !== 'macos' && (
          <div className="flex items-center border-l border-border gap-1 pr-1">
            <IconButton
              size="small"
              onClick={() => win.minimize()}
              title="最小化"
              sx={{
                width: '40px',
                height: '40px',
                color: 'text.secondary',
                fontSize: '14px',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              −
            </IconButton>
            <IconButton
              size="small"
              onClick={() => win.toggleMaximize()}
              title="最大化 / 还原"
              sx={{
                width: '40px',
                height: '40px',
                color: 'text.secondary',
                fontSize: '14px',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              □
            </IconButton>
            <IconButton
              size="small"
              onClick={() => win.close()}
              title="关闭"
              sx={{
                width: '40px',
                height: '40px',
                color: 'text.secondary',
                fontSize: '14px',
                '&:hover': {
                  bgcolor: 'error.main',
                  color: 'white',
                },
              }}
            >
              ✕
            </IconButton>
          </div>
        )}
      </header>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 bg-surface">
          <ExpertMode onOpenSettings={() => setShowSettings(true)} />
        </main>
        
        {/* AI 聊天侧边栏 */}
        {showChat && (
          <aside className="w-96 border-l border-border bg-white flex flex-col">
            <AIChat />
          </aside>
        )}
      </div>

      {/* 设置弹窗 */}
      {showSettings && <AISettings onClose={() => setShowSettings(false)} />}
      </div>
    </ThemeProvider>
  )
}

export default App
