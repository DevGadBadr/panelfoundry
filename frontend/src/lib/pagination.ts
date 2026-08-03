export type PageItem = number | 'ellipsis'

export const PAGE_SIZE_OPTIONS = [25, 50, 100] as const
export const DEFAULT_PAGE_SIZE = 50
export const PAGE_WINDOW_SIZE = 4

/** Page numbers with first/last always visible and ellipsis for gaps. */
export function getPaginationItems(
  current: number,
  total: number,
  size = PAGE_WINDOW_SIZE,
): PageItem[] {
  if (total <= 0) return []
  if (total <= size + 2) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  let start = Math.max(1, current - Math.floor((size - 1) / 2))
  let end = start + size - 1
  if (end > total) {
    end = total
    start = end - size + 1
  }

  const items: PageItem[] = []
  if (start > 1) {
    items.push(1)
    if (start > 2) items.push('ellipsis')
  }
  for (let i = start; i <= end; i++) items.push(i)
  if (end < total) {
    if (end < total - 1) items.push('ellipsis')
    items.push(total)
  }
  return items
}
