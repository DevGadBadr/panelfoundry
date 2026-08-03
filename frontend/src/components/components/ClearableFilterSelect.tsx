import { X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

type ClearableFilterSelectProps = {
  label: string
  ariaLabel: string
  value: string | null
  allValue: string
  options: string[]
  onChange: (value: string | null) => void
  onClear: () => void
  triggerClassName?: string
}

export function ClearableFilterSelect({
  label,
  ariaLabel,
  value,
  allValue,
  options,
  onChange,
  onClear,
  triggerClassName = 'w-[7.25rem] max-w-[7.25rem]',
}: ClearableFilterSelectProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div
        className={cn(
          'flex items-stretch overflow-hidden rounded-[min(var(--radius-md),12px)] border border-input bg-transparent dark:bg-input/30',
          value && 'border-foreground/40 pr-0',
        )}
      >
        <Select
          value={value ?? allValue}
          onValueChange={(next) => {
            onChange(next === allValue ? null : (next as string))
          }}
        >
          <SelectTrigger
            size="sm"
            className={cn(
              'h-7 min-w-0 gap-1.5 border-0 bg-transparent px-2 text-xs shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent',
              triggerClassName,
              value && 'rounded-none rounded-l-[min(var(--radius-md),12px)]',
            )}
            aria-label={ariaLabel}
          >
            <SelectValue
              placeholder="All"
              className="min-w-0 truncate text-left"
            >
              {(selected) =>
                !selected || selected === allValue ? 'All' : String(selected)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value={allValue}>All</SelectItem>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {value && (
          <button
            type="button"
            className="flex h-7 w-7 shrink-0 items-center justify-center border-l border-input text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            onClick={onClear}
            aria-label={`Clear ${label.toLowerCase()} filter: ${value}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
