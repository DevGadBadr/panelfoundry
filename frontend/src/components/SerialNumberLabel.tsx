import { cn } from '@/lib/utils'

interface Props {
  serial: string
  isGenerated?: boolean
  className?: string
}

export function SerialNumberLabel({ serial, isGenerated = false, className }: Props) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 min-w-0', className)}>
      <span className="font-mono font-medium truncate">{serial}</span>
      {isGenerated && (
        <span className="shrink-0 text-[10px] text-muted-foreground font-normal">
          App generated
        </span>
      )}
    </span>
  )
}
