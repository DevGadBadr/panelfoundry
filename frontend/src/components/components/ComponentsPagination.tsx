import { Button } from '@/components/ui/button'
import type { PageItem } from '@/lib/pagination'
import { cn } from '@/lib/utils'

type ComponentsPaginationProps = {
  rangeStart: number
  rangeEnd: number
  totalCount: number
  pageCount: number
  isFetching: boolean
  showPager: boolean
  page: number
  pageItems: PageItem[]
  onPageChange: (page: number) => void
}

export function ComponentsPagination({
  rangeStart,
  rangeEnd,
  totalCount,
  pageCount,
  isFetching,
  showPager,
  page,
  pageItems,
  onPageChange,
}: ComponentsPaginationProps) {
  if (totalCount <= 0) return null

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-t border-border/80 px-4 py-2',
        isFetching && 'opacity-70',
      )}
    >
      <p className="text-xs text-muted-foreground tabular-nums">
        {rangeStart}–{rangeEnd} of {totalCount}
        <span className="text-border mx-1.5">·</span>
        {pageCount} on page
      </p>
      {showPager && (
        <nav className="flex items-center gap-0.5" aria-label="Pagination">
          {pageItems.map((item, index) =>
            item === 'ellipsis' ? (
              <span
                key={`ellipsis-${index}`}
                className="flex h-7 min-w-7 items-center justify-center px-1 text-xs text-muted-foreground"
                aria-hidden
              >
                …
              </span>
            ) : (
              <Button
                key={item}
                type="button"
                variant={item === page ? 'outline' : 'ghost'}
                size="sm"
                className={cn(
                  'h-7 min-w-7 px-1.5 text-xs tabular-nums',
                  item === page && 'pointer-events-none',
                )}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => onPageChange(item)}
              >
                {item}
              </Button>
            ),
          )}
        </nav>
      )}
    </div>
  )
}
