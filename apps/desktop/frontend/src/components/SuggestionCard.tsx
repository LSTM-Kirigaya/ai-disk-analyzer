import { useState, useEffect } from 'react'
import { Trash2, MoveRight, File, FolderOpen, Clock, HardDrive, AlertCircle, Check, X, Info } from 'lucide-react'
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box, Chip, Checkbox, FormControlLabel } from '@mui/material'
import type { CleanupSuggestion } from '../services/ai-analysis'
import { readStorageFile, writeStorageFile } from '../services/storage'

const SKIP_CONFIRM_KEY = 'skip-action-confirm'

interface Props {
  suggestion: CleanupSuggestion
  onDelete: (path: string) => Promise<void>
  onMove: (path: string) => Promise<void>
}

export function SuggestionCard({ suggestion, onDelete, onMove }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [skipConfirm, setSkipConfirm] = useState(false)
  const [dontAskAgain, setDontAskAgain] = useState(false)

  useEffect(() => {
    readStorageFile(SKIP_CONFIRM_KEY).then(val => {
      setSkipConfirm(val === 'true')
    })
  }, [])

  const handleActionClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (skipConfirm) {
      await executeAction()
    } else {
      setShowConfirm(true)
    }
  }

  const executeAction = async () => {
    setLoading(true)
    setError('')
    
    try {
      if (suggestion.action === 'delete') {
        await onDelete(suggestion.path)
      } else {
        await onMove(suggestion.path)
      }
      setSuccess(true)
      setTimeout(() => {
        setShowConfirm(false)
        setSuccess(false)
      }, 1000)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (dontAskAgain) {
      setSkipConfirm(true)
      await writeStorageFile(SKIP_CONFIRM_KEY, 'true')
    }
    await executeAction()
  }

  const ActionIcon = suggestion.action === 'delete' ? Trash2 : MoveRight
  const TypeIcon = suggestion.type === 'file' ? File : FolderOpen
  const actionColor = suggestion.action === 'delete' ? '#ef4444' : '#3b82f6'
  const actionLabel = suggestion.action === 'delete' ? '删除' : '迁移'
  const fileName = suggestion.path.split(/[/\\]/).pop() || suggestion.path

  return (
    <>
      {/* 简化的卡片 */}
      <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl p-3 hover:border-slate-300 dark:hover:border-gray-600 transition-all">
        <div className="flex items-center gap-3">
          {/* 左侧图标 */}
          <div 
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${actionColor}15` }}
          >
            <TypeIcon size={18} style={{ color: actionColor }} />
          </div>
          
          {/* 中间信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-gray-200 truncate">
                {fileName}
              </span>
              <Chip 
                label={suggestion.size}
                size="small"
                sx={{ 
                  height: '18px',
                  fontSize: '10px',
                  fontWeight: 600,
                  bgcolor: 'action.hover',
                  color: 'text.secondary',
                }}
                className="dark:!bg-gray-700 dark:!text-gray-300"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400 truncate mt-0.5">
              {suggestion.message}
            </p>
          </div>
          
          {/* 右侧按钮组 */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                setShowDetail(true)
              }}
              sx={{
                minWidth: 'auto',
                px: 1.5,
                py: 0.5,
                fontSize: '11px',
                textTransform: 'none',
                color: 'text.secondary',
                borderRadius: '6px',
                '&:hover': {
                  bgcolor: 'action.hover',
                }
              }}
            >
              <Info size={14} />
            </Button>
            <Button
              size="small"
              onClick={handleActionClick}
              disabled={loading || (suggestion.action === 'move')}
              sx={{
                minWidth: 'auto',
                px: 1.5,
                py: 0.5,
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'none',
                bgcolor: actionColor,
                color: 'white',
                borderRadius: '6px',
                '&:hover': {
                  bgcolor: actionColor,
                  filter: 'brightness(0.9)',
                },
                '&.Mui-disabled': {
                  bgcolor: 'action.disabledBackground',
                  color: 'text.disabled',
                }
              }}
            >
              {loading ? '...' : actionLabel}
            </Button>
          </div>
        </div>
      </div>

      {/* 确认对话框 */}
      <Dialog 
        open={showConfirm} 
        onClose={() => !loading && setShowConfirm(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            bgcolor: 'background.paper',
          },
          className: 'dark:!bg-gray-800'
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 2.5, px: 3 }} className="dark:text-gray-100">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                bgcolor: `${actionColor}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ActionIcon size={20} style={{ color: actionColor }} />
            </Box>
            <Typography variant="h6" component="span" sx={{ fontSize: '16px', fontWeight: 700 }}>
              确认{actionLabel}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ py: 2, px: 3 }} className="dark:text-gray-100">
          {success ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 3 }}>
              <Check size={40} className="text-green-500" />
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                操作成功！
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5, 
                  p: 2, 
                  bgcolor: 'action.hover', 
                  borderRadius: '10px' 
                }}
                className="dark:!bg-gray-700"
              >
                <TypeIcon size={16} className="text-slate-500 dark:text-gray-400 shrink-0" />
                <Typography 
                  variant="body2" 
                  sx={{ fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-all' }}
                  className="dark:text-gray-300"
                >
                  {suggestion.path}
                </Typography>
              </Box>

              {suggestion.action === 'move' && (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'start', 
                    gap: 1, 
                    p: 1.5, 
                    bgcolor: 'info.main', 
                    color: 'white', 
                    borderRadius: '8px',
                    opacity: 0.9
                  }}
                >
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <Typography variant="caption" sx={{ fontSize: '11px' }}>
                    迁移功能正在开发中
                  </Typography>
                </Box>
              )}

              {error && (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'start', 
                    gap: 1, 
                    p: 1.5, 
                    bgcolor: 'error.main', 
                    color: 'white', 
                    borderRadius: '8px' 
                  }}
                >
                  <X size={14} className="shrink-0 mt-0.5" />
                  <Typography variant="caption" sx={{ fontSize: '11px' }}>
                    {error}
                  </Typography>
                </Box>
              )}

              <FormControlLabel
                control={
                  <Checkbox 
                    size="small" 
                    checked={dontAskAgain}
                    onChange={(e) => setDontAskAgain(e.target.checked)}
                    sx={{ 
                      p: 0.5,
                      '&.Mui-checked': {
                        color: 'primary.main',
                      }
                    }}
                  />
                }
                label={
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '11px' }} className="dark:text-gray-400">
                    下次不再提醒
                  </Typography>
                }
                sx={{ ml: 0, mt: 1 }}
              />
            </Box>
          )}
        </DialogContent>

        {!success && (
          <DialogActions sx={{ borderTop: 1, borderColor: 'divider', p: 2, gap: 1 }} className="dark:!border-gray-700">
            <Button 
              onClick={() => setShowConfirm(false)} 
              disabled={loading}
              variant="outlined"
              size="small"
              sx={{
                textTransform: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'text.secondary',
                borderColor: 'divider',
              }}
              className="dark:!border-gray-600 dark:!text-gray-300"
            >
              取消
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading || (suggestion.action === 'move')}
              variant="contained"
              size="small"
              sx={{
                textTransform: 'none',
                borderRadius: '8px',
                bgcolor: actionColor,
                color: 'white',
                fontSize: '12px',
                fontWeight: 700,
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: actionColor,
                  filter: 'brightness(0.9)',
                  boxShadow: 'none',
                },
                '&.Mui-disabled': {
                  bgcolor: 'action.disabledBackground'
                }
              }}
            >
              {loading ? '处理中...' : `确认${actionLabel}`}
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* 详情对话框 */}
      <Dialog 
        open={showDetail} 
        onClose={() => setShowDetail(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            bgcolor: 'background.paper',
          },
          className: 'dark:!bg-gray-800'
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 2.5, px: 3 }} className="dark:text-gray-100">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                bgcolor: `${actionColor}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ActionIcon size={22} style={{ color: actionColor }} />
            </Box>
            <Box>
              <Typography variant="h6" component="span" sx={{ fontSize: '16px', fontWeight: 700 }}>
                {actionLabel}建议详情
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.25 }} className="dark:text-gray-400">
                {suggestion.type === 'file' ? '文件' : '目录'}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ py: 2, px: 3 }} className="dark:text-gray-100">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* 路径 */}
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="dark:text-gray-400">
                路径
              </Typography>
              <Box 
                sx={{ 
                  mt: 0.75,
                  p: 1.5, 
                  bgcolor: 'action.hover', 
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
                className="dark:!bg-gray-700/50 dark:!border-gray-600"
              >
                <Typography 
                  variant="body2" 
                  sx={{ fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all', lineHeight: 1.5 }}
                  className="dark:text-gray-200"
                >
                  {suggestion.path}
                </Typography>
              </Box>
            </Box>

            {/* 信息网格 */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box 
                sx={{ 
                  p: 2, 
                  bgcolor: 'action.hover', 
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
                className="dark:!bg-gray-700/50 dark:!border-gray-600"
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <HardDrive size={14} className="text-slate-400 dark:text-gray-500" />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '10px' }} className="dark:text-gray-400">
                    大小
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '18px' }} className="dark:text-gray-100">
                  {suggestion.size}
                </Typography>
              </Box>

              <Box 
                sx={{ 
                  p: 2, 
                  bgcolor: 'action.hover', 
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
                className="dark:!bg-gray-700/50 dark:!border-gray-600"
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Clock size={14} className="text-slate-400 dark:text-gray-500" />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '10px' }} className="dark:text-gray-400">
                    修改时间
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '13px' }} className="dark:text-gray-100">
                  {suggestion.updateTime}
                </Typography>
              </Box>
            </Box>

            {/* 建议说明 */}
            <Box 
              sx={{ 
                p: 2, 
                bgcolor: 'primary.main', 
                borderRadius: '10px' 
              }}
            >
              <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.6)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                建议说明
              </Typography>
              <Typography variant="body2" sx={{ color: '#1A1A1A', fontSize: '13px', lineHeight: 1.6, mt: 0.5, fontWeight: 500 }}>
                {suggestion.message}
              </Typography>
            </Box>

            {suggestion.action === 'move' && (
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'start', 
                  gap: 1.5, 
                  p: 2, 
                  bgcolor: 'info.main', 
                  color: 'white', 
                  borderRadius: '10px', 
                  opacity: 0.9 
                }}
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <Typography variant="body2" sx={{ fontSize: '12px' }}>
                  迁移功能正在开发中，后续将支持自动迁移到网盘
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ borderTop: 1, borderColor: 'divider', p: 2, gap: 1 }} className="dark:!border-gray-700">
          <Button 
            onClick={() => setShowDetail(false)} 
            variant="outlined"
            size="small"
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'text.secondary',
              borderColor: 'divider',
            }}
            className="dark:!border-gray-600 dark:!text-gray-300"
          >
            关闭
          </Button>
          <Button
            onClick={handleActionClick}
            disabled={suggestion.action === 'move'}
            variant="contained"
            size="small"
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              bgcolor: actionColor,
              color: 'white',
              fontSize: '12px',
              fontWeight: 700,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: actionColor,
                filter: 'brightness(0.9)',
                boxShadow: 'none',
              },
              '&.Mui-disabled': {
                bgcolor: 'action.disabledBackground'
              }
            }}
          >
            {actionLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
