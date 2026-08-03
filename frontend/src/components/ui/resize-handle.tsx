import { cn } from '@/lib/utils'

type ResizeHandleProps = {
  /** Accessible name for the separator. */
  label: string
  active?: boolean
  className?: string
  onDragStart: (clientX: number) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

/**
 * Thin vertical hairline with a wider invisible hit area for column/panel resize.
 */
export function ResizeHandle({
  label,
  active = false,
  className,
  onDragStart,
  onMouseEnter,
  onMouseLeave,
}: ResizeHandleProps) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      data-slot="resize-handle"
      className={cn(
        'absolute top-0 z-10 h-full w-2.5 -translate-x-1/2 cursor-col-resize touch-none select-none',
        'after:pointer-events-none after:absolute after:inset-y-1.5 after:left-1/2 after:w-px after:-translate-x-1/2 after:rounded-full after:bg-border/50 after:transition-colors',
        'hover:after:bg-foreground/20',
        active && 'after:bg-foreground/30',
        className,
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onDragStart(event.clientX)
      }}
    />
  )
}
