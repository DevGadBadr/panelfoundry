import type { ReactNode } from 'react'
import { Pencil, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ResizeHandle } from '@/components/ui/resize-handle'
import { cn } from '@/lib/utils'

type ComponentSidePanelProps = {
  panelOpen: boolean
  panelMounted: boolean
  panelWidth: number
  canResize: boolean
  isResizing: boolean
  transitionsReady: boolean
  title: ReactNode
  subtitle?: ReactNode
  showEdit?: boolean
  onEdit?: () => void
  onClose: () => void
  onStartResize: (clientX: number) => void
  children: ReactNode
}

export function ComponentSidePanel({
  panelOpen,
  panelMounted,
  panelWidth,
  canResize,
  isResizing,
  transitionsReady,
  title,
  subtitle,
  showEdit = false,
  onEdit,
  onClose,
  onStartResize,
  children,
}: ComponentSidePanelProps) {
  return (
    <aside
      className={cn(
        'flex min-h-0 shrink-0 flex-col overflow-hidden',
        transitionsReady &&
          !isResizing &&
          'transition-[width] duration-300 ease-in-out',
      )}
      style={{ width: panelOpen ? panelWidth : 0 }}
      aria-hidden={!panelOpen}
    >
      <div
        className={cn(
          'relative flex h-full min-h-0 flex-col bg-card dark:shadow-[-12px_0_24px_-16px_rgba(0,0,0,0.55)]',
          transitionsReady && 'transition-transform duration-300 ease-in-out',
          panelOpen ? 'translate-x-0' : 'translate-x-full',
        )}
        style={{ width: panelWidth }}
      >
        {panelOpen && canResize && (
          <ResizeHandle
            label="Resize panel"
            active={isResizing}
            className="left-0"
            onDragStart={onStartResize}
          />
        )}
        {panelMounted && (
          <div className="flex min-h-0 flex-1 flex-col border-l border-border/80">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/80 px-6 py-4">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-medium">{title}</h2>
                {subtitle}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {showEdit && onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={onEdit}
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onClose}
                  aria-label="Close panel"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
              {children}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
