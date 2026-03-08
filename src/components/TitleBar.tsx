import { Minus, Square, X, Settings } from 'lucide-react'
import { useTranslation } from '../i18n'

interface TitleBarProps {
  onOpenSettings?: () => void
}

const isMac = window.electronAPI?.platform === 'darwin'

export default function TitleBar({ onOpenSettings }: TitleBarProps) {
  const { t } = useTranslation()
  return (
    <div className="titlebar-drag flex items-center justify-between bg-surface-300 h-9 px-3 border-b border-surface-100/50 flex-shrink-0">
      <div className="flex items-center gap-2" style={isMac ? { paddingLeft: 68 } : undefined}>
        <div className="w-4 h-4 rounded bg-accent flex items-center justify-center text-[8px] font-bold text-surface-300">
          S+
        </div>
        <span className="text-xs font-medium text-text-secondary">{t('app.name')}</span>
        <span className="text-[10px] text-text-muted/50">v0.1.1</span>
      </div>
      <div className="titlebar-no-drag flex items-center">
        <button
          onClick={onOpenSettings}
          className="w-10 h-9 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-100/50 transition-colors"
          title="Settings (Ctrl+,)"
        >
          <Settings size={14} />
        </button>
        {!isMac && (
          <>
            <button
              onClick={() => window.electronAPI?.minimize()}
              className="w-10 h-9 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-100/50 transition-colors"
            >
              <Minus size={14} />
            </button>
            <button
              onClick={() => window.electronAPI?.maximize()}
              className="w-10 h-9 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-100/50 transition-colors"
            >
              <Square size={11} />
            </button>
            <button
              onClick={() => window.electronAPI?.close()}
              className="w-10 h-9 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-red-500/80 transition-colors"
            >
              <X size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
