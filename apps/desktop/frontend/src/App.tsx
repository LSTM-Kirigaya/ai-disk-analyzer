import { useState, useEffect, useMemo } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { open } from '@tauri-apps/plugin-shell'
import { Settings, Github, Mail, ExternalLink, Sun, Moon, Monitor, FolderOpen } from 'lucide-react'
import { ThemeProvider, createTheme, CssBaseline, IconButton, Box, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText, Button } from '@mui/material'
import { ExpertMode } from './components/ExpertMode'
import { AISettings } from './components/AISettings'
import { SnapshotDialog } from './components/SnapshotDialog'
import type { Snapshot } from './services/snapshot'
import { readStorageFile, writeStorageFile } from './services/storage'

const THEME_STORAGE_FILE = 'theme.txt'

function App() {
  const win = getCurrentWindow()
  const [showSettings, setShowSettings] = useState(false)
  const [showSnapshots, setShowSnapshots] = useState(false)
  const [loadedSnapshot, setLoadedSnapshot] = useState<Snapshot | null>(null)
  const [platform, setPlatform] = useState<'macos' | 'windows' | 'linux'>('windows')
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>('system')
  const [themeMenuAnchor, setThemeMenuAnchor] = useState<null | HTMLElement>(null)
  const [language, setLanguage] = useState<string>('en')

  // 检测系统主题
  const systemTheme = useMemo(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }, [])

  // 计算实际使用的主题
  const themeMode = themePreference === 'system' ? systemTheme : themePreference

  // 监听系统主题变化
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => {
        if (themePreference === 'system') {
          document.documentElement.classList.toggle('dark', mediaQuery.matches)
        }
      }
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [themePreference])

  // 加载主题设置
  useEffect(() => {
    readStorageFile(THEME_STORAGE_FILE).then(stored => {
      if (stored === 'dark' || stored === 'light' || stored === 'system') {
        setThemePreference(stored)
      }
    })
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark')
    void writeStorageFile(THEME_STORAGE_FILE, themePreference)
  }, [themeMode, themePreference])

  // 检测语言
  useEffect(() => {
    const detectLanguage = () => {
      const browserLang = navigator.language.toLowerCase()
      setLanguage(browserLang.startsWith('zh') ? 'zh' : 'en')
    }
    detectLanguage()
  }, [])

  const theme = useMemo(() => createTheme({
    palette: {
      mode: themeMode,
      primary: {
        main: '#FFD200',
      },
      secondary: {
        main: themeMode === 'dark' ? '#FFD200' : '#1A1A1A',
      },
      background: {
        default: themeMode === 'dark' ? '#111827' : '#FFFFFF',
        paper: themeMode === 'dark' ? '#1F2937' : '#F5F5F5',
      },
    },
    shape: {
      borderRadius: 12,
    },
  }), [themeMode])

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
      <div className={`min-h-screen flex flex-col overflow-hidden ${themeMode === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white text-text-main'}`} style={{ height: '100vh' }}>
      {/* 菜单栏固定顶部，向下滚动时始终可见 */}
      <header className={`sticky top-0 z-50 shrink-0 h-10 flex items-center border-b select-none ${themeMode === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-border bg-white'} ${platform === 'macos' ? 'pl-16' : ''}`}>
        {/* macOS 窗口控制按钮（左上角） */}
        {platform === 'macos' && (
          <Box
            sx={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              gap: 1,
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

        {/* 左侧：应用名称 */}
        <div
          data-tauri-drag-region
          onMouseDown={handleTitleBarMouseDown}
          className="flex items-center px-4 h-full cursor-default"
          style={{ flex: '0 0 auto' }}
        >
          <span className={`text-sm font-semibold ${themeMode === 'dark' ? 'text-gray-100' : 'text-secondary'}`}>
            {language === 'zh' ? '磁盘菜鸟' : 'DiskRookie'}
          </span>
        </div>
        
        {/* 中间：快照按钮（居中） */}
        <div
          data-tauri-drag-region
          onMouseDown={handleTitleBarMouseDown}
          className="flex-1 flex items-center justify-center h-full cursor-default px-4"
        >
          <Button
            onClick={() => setShowSnapshots(true)}
            sx={(theme) => ({
              minWidth: '280px',
              maxWidth: '400px',
              height: '28px',
              px: 1.5,
              py: 0.5,
              textTransform: 'none',
              borderRadius: '6px',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(30, 30, 30, 0.5)' 
                : 'rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(8px)',
              color: 'text.secondary',
              fontSize: '12px',
              fontWeight: 500,
              justifyContent: 'center',
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(40, 40, 40, 0.7)'
                  : 'rgba(255, 255, 255, 0.7)',
                borderColor: 'primary.main',
                color: 'primary.main',
              },
            })}
          >
            {loadedSnapshot ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                <span style={{ fontSize: '11px', fontWeight: 600, lineHeight: 1.2 }}>
                  {loadedSnapshot.name}
                </span>
                <span style={{ fontSize: '9px', opacity: 0.6, lineHeight: 1.2 }}>
                  {new Date(loadedSnapshot.timestamp).toLocaleString('zh-CN', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </Box>
            ) : (
              '快照管理'
            )}
          </Button>
        </div>
        
        {/* 项目信息链接 */}
        <div className={`flex items-center h-full px-2 gap-0.5 border-r mr-1 ${themeMode === 'dark' ? 'border-gray-700' : 'border-border'}`}>
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
          <Tooltip title="主题设置" arrow>
            <IconButton
              size="small"
              onClick={(e) => setThemeMenuAnchor(e.currentTarget)}
              sx={{
                width: '28px',
                height: '28px',
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              {themePreference === 'system' ? (
                <Monitor className="w-4 h-4" />
              ) : themeMode === 'dark' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={themeMenuAnchor}
            open={Boolean(themeMenuAnchor)}
            onClose={() => setThemeMenuAnchor(null)}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem
              selected={themePreference === 'light'}
              onClick={() => {
                setThemePreference('light')
                setThemeMenuAnchor(null)
              }}
            >
              <ListItemIcon>
                <Sun className="w-4 h-4" />
              </ListItemIcon>
              <ListItemText>浅色</ListItemText>
            </MenuItem>
            <MenuItem
              selected={themePreference === 'dark'}
              onClick={() => {
                setThemePreference('dark')
                setThemeMenuAnchor(null)
              }}
            >
              <ListItemIcon>
                <Moon className="w-4 h-4" />
              </ListItemIcon>
              <ListItemText>深色</ListItemText>
            </MenuItem>
            <MenuItem
              selected={themePreference === 'system'}
              onClick={() => {
                setThemePreference('system')
                setThemeMenuAnchor(null)
              }}
            >
              <ListItemIcon>
                <Monitor className="w-4 h-4" />
              </ListItemIcon>
              <ListItemText>跟随系统</ListItemText>
            </MenuItem>
          </Menu>
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
          <div className={`flex items-center border-l gap-1 pr-1 ${themeMode === 'dark' ? 'border-gray-700' : 'border-border'}`}>
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
        <main className={`flex-1 flex flex-col min-h-0 overflow-y-auto p-4 ${themeMode === 'dark' ? 'bg-gray-800' : 'bg-surface'}`}>
          <ExpertMode 
            onOpenSettings={() => setShowSettings(true)} 
            loadedSnapshot={loadedSnapshot}
            onSnapshotLoaded={() => setLoadedSnapshot(null)}
          />
        </main>
      </div>

      {/* 设置弹窗 */}
      {showSettings && <AISettings onClose={() => setShowSettings(false)} />}
      
      {/* 快照管理对话框 */}
      <SnapshotDialog 
        open={showSnapshots} 
        onClose={() => setShowSnapshots(false)}
        onLoadSnapshot={(snapshot) => setLoadedSnapshot(snapshot)}
      />
      </div>
    </ThemeProvider>
  )
}

export default App
