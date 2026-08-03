import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { readJson, writeJson } from '@/lib/safeStorage'
import {
  DEFAULT_MIN_WIDTH,
  fitWidthsToContainer,
  liftToMinimum,
  resolveColumnWidths,
  resolveMinWidths,
  sameWidths,
  shareProportionally,
  type ColumnWidths,
} from '@/hooks/columnWidthMath'

export type { ColumnWidths } from '@/hooks/columnWidthMath'
export {
  resolveMinWidths,
  resolveColumnWidths,
  fitWidthsToContainer,
} from '@/hooks/columnWidthMath'

function readStoredWidths(storageKey: string): ColumnWidths | null {
  const parsed = readJson<Record<string, unknown>>(storageKey)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null

  const widths: ColumnWidths = {}
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      widths[key] = value
    }
  }
  return Object.keys(widths).length > 0 ? widths : null
}

function writeStoredWidths(storageKey: string, widths: ColumnWidths) {
  writeJson(storageKey, widths)
}

export type UseColumnWidthsOptions = {
  storageKey: string
  /** Relative default widths keyed by column id (key order = column order). */
  defaultWidths: ColumnWidths
  minWidth?: number
  /** Per-column minimum widths, for columns that need more room than the rest. */
  minWidths?: ColumnWidths
  /** Measured table container width in px. When 0, widths stay as resolved defaults. */
  containerWidth: number
}

/**
 * Resizable table columns at a fixed total width: the table always spans its
 * container exactly and never scrolls sideways.
 *
 * Widening a column spends the last column's spare width first, so the columns
 * in between simply slide right at their current size. Only once the last
 * column is down to its minimum do the rest start giving up width in
 * proportion. Narrowing a column hands the space back to everything on its
 * right proportionally.
 *
 * Stored widths are relative: the container size is applied at render time, so
 * narrowing the table (a side panel opening, say) scales the columns down and
 * widening restores them untouched. When the container is narrower than the
 * sum of column floors, columns stay at their mins and the UI clips.
 */
export function useColumnWidths({
  storageKey,
  defaultWidths,
  minWidth = DEFAULT_MIN_WIDTH,
  minWidths,
  containerWidth,
}: UseColumnWidthsOptions) {
  const defaultsRef = useRef(defaultWidths)
  defaultsRef.current = defaultWidths

  // Keep one array identity per column set so memos below actually hold.
  const nextColumnIds = Object.keys(defaultWidths)
  const defaultIds = nextColumnIds.join('\0')
  const columnIdsRef = useRef(nextColumnIds)
  if (columnIdsRef.current.join('\0') !== defaultIds) {
    columnIdsRef.current = nextColumnIds
  }
  const columnIds = columnIdsRef.current

  // Same trick for the floors, so they only change identity when a value does.
  const nextMins = resolveMinWidths(columnIds, minWidth, minWidths)
  const minsRef = useRef(nextMins)
  if (!sameWidths(minsRef.current, nextMins)) {
    minsRef.current = nextMins
  }
  const mins = minsRef.current

  const containerWidthRef = useRef(containerWidth)
  containerWidthRef.current = containerWidth

  const [widths, setWidths] = useState<ColumnWidths>(() =>
    resolveColumnWidths(defaultWidths, readStoredWidths(storageKey), mins),
  )

  const widthsRef = useRef(widths)
  widthsRef.current = widths

  // Column set changed — add defaults for new columns, drop removed ones.
  useEffect(() => {
    setWidths((prev) => {
      const next = resolveColumnWidths(defaultsRef.current, prev, minsRef.current)
      return sameWidths(prev, next) ? prev : next
    })
  }, [defaultIds])

  const renderedWidths = useMemo(
    () => fitWidthsToContainer(widths, columnIds, containerWidth, mins),
    [widths, columnIds, containerWidth, mins],
  )

  const totalWidth = useMemo(
    () => Object.values(renderedWidths).reduce((sum, w) => sum + w, 0),
    [renderedWidths],
  )

  const dragRef = useRef<{
    columnId: string
    startX: number
    startWidth: number
    /** Widths of every column when the drag began; moves are measured off these. */
    startWidths: ColumnWidths
    /** Columns right of the handle — they absorb whatever the drag hands out. */
    rightIds: string[]
    rightTotal: number
    /** How much the right side can give up in total before everything is at its floor. */
    rightSlack: number
    /** The last column, which is spent first, and the ones before it. */
    lastId: string
    lastSlack: number
    middleIds: string[]
    middleTotal: number
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
      clearDragListeners()
    }
  }, [clearDragListeners])

  const startResize = useCallback(
    (columnId: string, clientX: number) => {
      const ids = Object.keys(defaultsRef.current)
      const index = ids.indexOf(columnId)
      // The last column's right edge is the table's right edge: nothing to give.
      if (index < 0 || index >= ids.length - 1) return

      clearDragListeners()

      const columnMins = minsRef.current
      // Measure against the pixels currently on screen, not the relative widths.
      const baked = fitWidthsToContainer(
        widthsRef.current,
        ids,
        containerWidthRef.current,
        columnMins,
      )
      widthsRef.current = baked
      setWidths(baked)

      const rightIds = ids.slice(index + 1)
      const rightTotal = rightIds.reduce((sum, id) => sum + baked[id], 0)
      const rightSlack = rightIds.reduce((sum, id) => sum + baked[id] - columnMins[id], 0)
      const lastId = ids[ids.length - 1]
      const middleIds = rightIds.slice(0, -1)
      const startWidth = baked[columnId]

      dragRef.current = {
        columnId,
        startX: clientX,
        startWidth,
        startWidths: baked,
        rightIds,
        rightTotal,
        rightSlack,
        lastId,
        lastSlack: baked[lastId] - columnMins[lastId],
        middleIds,
        middleTotal: middleIds.reduce((sum, id) => sum + baked[id], 0),
      }
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      const onMove = (event: MouseEvent) => {
        const drag = dragRef.current
        if (!drag) return

        // Can't shrink past the minimum, or take more than the right side has.
        const delta = Math.max(
          columnMins[drag.columnId] - drag.startWidth,
          Math.min(drag.rightSlack, Math.round(event.clientX - drag.startX)),
        )

        const next: ColumnWidths = { ...drag.startWidths }
        next[drag.columnId] = drag.startWidth + delta

        if (delta > 0) {
          // Spend the last column's spare width first — the columns in between
          // keep their size and just slide right. Only what the last column
          // can't cover comes out of them, split by width.
          const fromLast = Math.min(delta, drag.lastSlack)
          next[drag.lastId] = drag.startWidths[drag.lastId] - fromLast

          const rest = delta - fromLast
          if (rest > 0 && drag.middleTotal > 0) {
            shareProportionally(
              next,
              drag.startWidths,
              drag.middleIds,
              drag.middleTotal,
              rest,
            )
            liftToMinimum(next, drag.middleIds, columnMins)
          }
        } else if (delta < 0 && drag.rightTotal > 0) {
          // Space handed back goes to everything on the right, last column
          // included, in proportion to how wide each one already is.
          shareProportionally(next, drag.startWidths, drag.rightIds, drag.rightTotal, delta)
        }

        setWidths((prev) => (sameWidths(prev, next) ? prev : next))
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
    widths: renderedWidths,
    totalWidth,
    columnIds,
    startResize,
    minWidths: mins,
    canResizeColumn,
  }
}
