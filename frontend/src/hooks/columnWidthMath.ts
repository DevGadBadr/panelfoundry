export type ColumnWidths = Record<string, number>

export const DEFAULT_MIN_WIDTH = 48

/** Per-column floor: the shared minimum unless that column overrides it. */
export function resolveMinWidths(
  columnIds: string[],
  minWidth: number,
  overrides?: ColumnWidths,
): ColumnWidths {
  const mins: ColumnWidths = {}
  for (const id of columnIds) {
    const override = overrides?.[id]
    mins[id] =
      typeof override === 'number' && Number.isFinite(override)
        ? Math.max(minWidth, override)
        : minWidth
  }
  return mins
}

/**
 * Raise any column under its minimum and take the pixels back from the widest
 * ones, keeping the total untouched. Mutates the object it is handed.
 */
export function liftToMinimum(
  widths: ColumnWidths,
  columnIds: string[],
  mins: ColumnWidths,
) {
  let debt = 0
  for (const id of columnIds) {
    if (widths[id] < mins[id]) {
      debt += mins[id] - widths[id]
      widths[id] = mins[id]
    }
  }
  if (debt <= 0) return

  const donors = columnIds
    .filter((id) => widths[id] > mins[id])
    .sort((a, b) => widths[b] - mins[b] - (widths[a] - mins[a]))
  for (const id of donors) {
    if (debt <= 0) break
    const take = Math.min(widths[id] - mins[id], debt)
    widths[id] -= take
    debt -= take
  }
}

/** Take `amount` px off `ids`, split in proportion to their starting widths. */
export function shareProportionally(
  target: ColumnWidths,
  start: ColumnWidths,
  ids: string[],
  basisTotal: number,
  amount: number,
) {
  // Measured against a running total so rounding can't leak or duplicate pixels.
  let walked = 0
  let given = 0
  for (const id of ids) {
    walked += start[id]
    const mark = Math.round((walked / basisTotal) * amount)
    target[id] = start[id] - (mark - given)
    given = mark
  }
}

export function sameWidths(a: ColumnWidths, b: ColumnWidths) {
  const aKeys = Object.keys(a)
  if (aKeys.length !== Object.keys(b).length) return false
  return aKeys.every((key) => a[key] === b[key])
}

/** Merge saved widths with defaults; drop unknown columns, fill missing ones. */
export function resolveColumnWidths(
  defaults: ColumnWidths,
  saved: ColumnWidths | null,
  mins: ColumnWidths,
): ColumnWidths {
  const next: ColumnWidths = {}
  for (const id of Object.keys(defaults)) {
    const savedWidth = saved?.[id]
    next[id] =
      typeof savedWidth === 'number' && Number.isFinite(savedWidth)
        ? Math.max(mins[id], savedWidth)
        : Math.max(mins[id], defaults[id])
  }
  return next
}

/**
 * Scale widths proportionally so they add up to exactly `containerWidth`, in
 * either direction. Stored widths are only ever relative: this is what turns
 * them into pixels, so the table always spans its container and never scrolls
 * sideways. The one exception is a container too narrow to hold every column at
 * its minimum, where the columns stop shrinking (the UI clips instead of scrolling).
 */
export function fitWidthsToContainer(
  widths: ColumnWidths,
  columnIds: string[],
  containerWidth: number,
  mins: ColumnWidths,
): ColumnWidths {
  const base: ColumnWidths = {}
  let current = 0
  let minTotal = 0
  for (const id of columnIds) {
    base[id] = Math.max(mins[id], Math.round(widths[id] ?? mins[id]))
    current += base[id]
    minTotal += mins[id]
  }

  const target = Math.max(containerWidth, minTotal)
  if (columnIds.length === 0 || containerWidth <= 0 || current === target) return base

  // Scale against a running total so rounding can't drift and the last column
  // lands exactly on the target.
  const scaled: ColumnWidths = {}
  let walked = 0
  let given = 0
  for (const id of columnIds) {
    walked += base[id]
    const mark = Math.round((walked / current) * target)
    scaled[id] = mark - given
    given = mark
  }

  // Scaling down can push narrow columns under their minimum.
  liftToMinimum(scaled, columnIds, mins)

  // When the container can hold every floor, force an exact pixel fit so a
  // leftover 1px from liftToMinimum cannot create a false horizontal overflow.
  if (containerWidth >= minTotal) {
    let sum = 0
    for (const id of columnIds) sum += scaled[id]
    let drift = sum - containerWidth
    if (drift !== 0) {
      for (let i = columnIds.length - 1; i >= 0 && drift !== 0; i--) {
        const id = columnIds[i]
        if (drift > 0) {
          const take = Math.min(drift, scaled[id] - mins[id])
          if (take <= 0) continue
          scaled[id] -= take
          drift -= take
        } else {
          scaled[id] -= drift
          drift = 0
        }
      }
    }
  }

  return scaled
}
