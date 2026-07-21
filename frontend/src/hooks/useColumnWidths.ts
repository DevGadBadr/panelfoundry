import { useCallback, useEffect, useRef, useState } from 'react'

export type ColumnWidths = Record<string, number>

const DEFAULT_MIN_WIDTH = 48

function readStoredWidths(storageKey: string): ColumnWidths | null {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null

    const widths: ColumnWidths = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        widths[key] = value
      }
    }
    return Object.keys(widths).length > 0 ? widths : null
  } catch {
    return null
  }
}

function writeStoredWidths(storageKey: string, widths: ColumnWidths) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(widths))
  } catch {
    // localStorage may be unavailable — ignore
  }
}

/** Merge saved widths with defaults; drop unknown columns, fill missing ones. */
export function resolveColumnWidths(
  defaults: ColumnWidths,
  saved: ColumnWidths | null,
  minWidth = DEFAULT_MIN_WIDTH,
): ColumnWidths {
  const next: ColumnWidths = {}
  for (const id of Object.keys(defaults)) {
    const savedWidth = saved?.[id]
    next[id] =
      typeof savedWidth === 'number' && Number.isFinite(savedWidth)
        ? Math.max(minWidth, savedWidth)
        : defaults[id]
  }
  return next
}

/** Scale column widths so they exactly fill `targetWidth` (keeps relative proportions). */
export function scaleWidthsToFit(
  widths: ColumnWidths,
  columnIds: string[],
  targetWidth: number,
  minWidth = DEFAULT_MIN_WIDTH,
): ColumnWidths {
  if (targetWidth <= 0 || columnIds.length === 0) return { ...widths }

  const minTotal = minWidth * columnIds.length
  const fitTarget = Math.max(targetWidth, minTotal)

  const currentTotal = columnIds.reduce((sum, id) => sum + (widths[id] ?? minWidth), 0)
  if (currentTotal <= 0) {
    const even = Math.floor(fitTarget / columnIds.length)
    const next: ColumnWidths = {}
    let used = 0
    columnIds.forEach((id, i) => {
      const w = i === columnIds.length - 1 ? fitTarget - used : even
      next[id] = Math.max(minWidth, w)
      used += next[id]
    })
    return next
  }

  // First pass: proportional scale
  const scaled: ColumnWidths = {}
  let used = 0
  columnIds.forEach((id, i) => {
    if (i === columnIds.length - 1) {
      scaled[id] = Math.max(minWidth, fitTarget - used)
    } else {
      const w = Math.max(
        minWidth,
        Math.round(((widths[id] ?? minWidth) / currentTotal) * fitTarget),
      )
      scaled[id] = w
      used += w
    }
  })

  // If early columns ate too much, clamp from the right neighbor chain.
  let overflow = columnIds.reduce((s, id) => s + scaled[id], 0) - fitTarget
  if (overflow > 0) {
    for (let i = columnIds.length - 1; i >= 0 && overflow > 0; i--) {
      const id = columnIds[i]
      const reducible = scaled[id] - minWidth
      const cut = Math.min(reducible, overflow)
      scaled[id] -= cut
      overflow -= cut
    }
  }

  return scaled
}

export type UseColumnWidthsOptions = {
  storageKey: string
  /** Relative default widths keyed by column id (key order = column order). */
  defaultWidths: ColumnWidths
  minWidth?: number
  /** Measured table container width in px. When 0, widths stay as resolved defaults. */
  containerWidth: number
}

/**
 * Fixed-width table columns: total width always matches the container.
 * Resizing a column steals/gives space only from the next column to its right.
 */
export function useColumnWidths({
  storageKey,
  defaultWidths,
  minWidth = DEFAULT_MIN_WIDTH,
  containerWidth,
}: UseColumnWidthsOptions) {
  const columnIds = Object.keys(defaultWidths)
  const defaultsRef = useRef(defaultWidths)
  defaultsRef.current = defaultWidths

  const minWidthRef = useRef(minWidth)
  minWidthRef.current = minWidth

  const hadStoredRef = useRef(readStoredWidths(storageKey) != null)
  const fittedOnceRef = useRef(false)
  const draggingRef = useRef(false)

  const [widths, setWidths] = useState<ColumnWidths>(() =>
    resolveColumnWidths(defaultWidths, readStoredWidths(storageKey), minWidth),
  )

  const widthsRef = useRef(widths)
  widthsRef.current = widths

  // Fit to container: first time we know the width, and whenever the container resizes.
  useEffect(() => {
    if (containerWidth <= 0 || draggingRef.current) return

    setWidths((prev) => {
      const base =
        !fittedOnceRef.current && !hadStoredRef.current
          ? resolveColumnWidths(defaultsRef.current, null, minWidthRef.current)
          : resolveColumnWidths(defaultsRef.current, prev, minWidthRef.current)

      fittedOnceRef.current = true
      return scaleWidthsToFit(
        base,
        Object.keys(defaultsRef.current),
        containerWidth,
        minWidthRef.current,
      )
    })
  }, [containerWidth])

  // Column set changed — re-resolve then fit.
  const defaultIds = columnIds.join('\0')
  useEffect(() => {
    if (containerWidth <= 0) return
    setWidths((prev) =>
      scaleWidthsToFit(
        resolveColumnWidths(defaultsRef.current, prev, minWidthRef.current),
        Object.keys(defaultsRef.current),
        containerWidth,
        minWidthRef.current,
      ),
    )
  }, [defaultIds, containerWidth])

  const dragRef = useRef<{
    columnId: string
    nextId: string
    startX: number
    startWidth: number
    startNextWidth: number
  } | null>(null)

  const listenersRef = useRef<{
    move: (e: MouseEvent) => void
    up: () => void
  } | null>(null)

  const clearDragListeners = useCallback(() => {
    if (!listenersRef.current) return
    window.removeEventListener('mousemove', listenersRef.current.move)
    window.removeEventListener('mouseup', listenersRef.current.up)
    listenersRef.current = null
  }, [])

  const finishResize = useCallback(() => {
    if (!dragRef.current) return
    dragRef.current = null
    draggingRef.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    clearDragListeners()
    writeStoredWidths(storageKey, widthsRef.current)
  }, [clearDragListeners, storageKey])

  useEffect(() => {
    return () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      dragRef.current = null
      draggingRef.current = false
      clearDragListeners()
    }
  }, [clearDragListeners])

  const startResize = useCallback(
    (columnId: string, clientX: number) => {
      const ids = Object.keys(defaultsRef.current)
      const index = ids.indexOf(columnId)
      // Last column has no right neighbor to trade width with.
      if (index < 0 || index >= ids.length - 1) return

      const nextId = ids[index + 1]
      clearDragListeners()

      const startWidth = widthsRef.current[columnId] ?? minWidthRef.current
      const startNextWidth = widthsRef.current[nextId] ?? minWidthRef.current

      dragRef.current = {
        columnId,
        nextId,
        startX: clientX,
        startWidth,
        startNextWidth,
      }
      draggingRef.current = true
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      const onMove = (event: MouseEvent) => {
        const drag = dragRef.current
        if (!drag) return

        const min = minWidthRef.current
        const rawDelta = event.clientX - drag.startX
        // Grow current → shrink next; shrink current → grow next.
        // Clamp so neither column goes below minWidth (fixed total width).
        const maxGrow = drag.startNextWidth - min
        const maxShrink = drag.startWidth - min
        const delta = Math.max(-maxShrink, Math.min(maxGrow, rawDelta))

        const nextWidth = drag.startWidth + delta
        const nextNeighbor = drag.startNextWidth - delta

        setWidths((prev) => {
          if (
            prev[drag.columnId] === nextWidth &&
            prev[drag.nextId] === nextNeighbor
          ) {
            return prev
          }
          return {
            ...prev,
            [drag.columnId]: nextWidth,
            [drag.nextId]: nextNeighbor,
          }
        })
      }

      const onUp = () => {
        finishResize()
      }

      listenersRef.current = { move: onMove, up: onUp }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [clearDragListeners, finishResize],
  )

  const canResizeColumn = useCallback(
    (columnId: string) => {
      const index = columnIds.indexOf(columnId)
      return index >= 0 && index < columnIds.length - 1
    },
    [columnIds],
  )

  return {
    widths,
    columnIds,
    startResize,
    minWidth,
    canResizeColumn,
  }
}
