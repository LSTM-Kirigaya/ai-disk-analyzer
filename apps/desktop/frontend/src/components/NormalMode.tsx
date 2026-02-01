import { Bot } from 'lucide-react'

export function NormalMode() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-muted">
      <Bot className="w-16 h-16 mb-4 opacity-60" />
      <h3 className="text-lg font-medium text-secondary mb-2">普通用户模式</h3>
      <p className="text-sm text-center max-w-sm">
        AI 智能分析功能开发中，将提供一键清理建议与冷数据迁移方案。
      </p>
    </div>
  )
}
