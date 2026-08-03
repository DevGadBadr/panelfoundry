import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type LabeledRowProps = {
  label: ReactNode
  children: ReactNode
  htmlFor?: string
  className?: string
  /** Form fields use slightly wider gaps; detail rows use denser spacing. */
  variant?: 'form' | 'detail'
}

export function LabeledRow({
  label,
  children,
  htmlFor,
  className,
  variant = 'detail',
}: LabeledRowProps) {
  if (variant === 'form') {
    return (
      <div
        className={cn(
          'grid grid-cols-[140px_1fr] items-center gap-x-3 gap-y-1',
          className,
        )}
      >
        <Label
          htmlFor={htmlFor}
          className="text-right text-xs text-muted-foreground"
        >
          {label}
        </Label>
        {children}
      </div>
    )
  }

  return (
    <div className={cn('grid grid-cols-[140px_1fr] text-xs gap-x-2 py-1', className)}>
      <span className="text-muted-foreground text-right">{label}</span>
      <span className="font-medium">{children ?? '—'}</span>
    </div>
  )
}
