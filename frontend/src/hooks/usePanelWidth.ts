import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

export const PANEL_DEFAULT_WIDTH_PX = 420
export const PANEL_MIN_WIDTH_PX = 420
const PANEL_MAX_RATIO = 0.5

function clampWidth(width: number, maxWidth: number) {
  return Math.max(PANEL_MIN_WIDTH_PX, Math.min(maxWidth, width))
}

export function usePanelWidth(
  containerRef: RefObject<HTMLElement | null>,
  panelOpen: boolean,
) {
  const [containerWidth, setContainerWidth] = useState(0)
  const [panelWidth, setPanelWidth] = useState(PANEL_DEFAULT_WIDTH_PX)
  const [isResizing, setIsResizing] = useState(false)

  const maxWidth = Math.floor(containerWidth * PANEL_MAX_RATIO)
  const canResize = panelOpen && maxWidth > PANEL_MIN_WIDTH_PX

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const update = () => {
      setContainerWidth(Math.floor(el.clientWidth))
    }
    update()

    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [containerRef])

  const resetWidth = useCallback(() => {
    setPanelWidth(PANEL_DEFAULT_WIDTH_PX)
  }, [])

  const dragRef = useRef<{
    startX: number
    startWidth: number
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
    setIsResizing(false)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    clearDragListeners()
  }, [clearDragListeners])

  useEffect(() => {
    return () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      dragRef.current = null
      clearDragListeners()
    }
  }, [clearDragListeners])

  const startResize = useCallback(
    (clientX: number) => {
      const currentMax = Math.floor(
        (containerRef.current?.clientWidth ?? 0) * PANEL_MAX_RATIO,
      )
      if (currentMax <= PANEL_MIN_WIDTH_PX) return

      clearDragListeners()

      dragRef.current = {
        startX: clientX,
        startWidth: panelWidth,
      }
      setIsResizing(true)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      const onMove = (event: MouseEvent) => {
        const drag = dragRef.current
        if (!drag) return

        const liveMax = Math.floor(
          (containerRef.current?.clientWidth ?? 0) * PANEL_MAX_RATIO,
        )
        // Left-edge handle on a right-anchored panel: drag left = wider, drag right = narrower.
        const delta = event.clientX - drag.startX
        const nextWidth = clampWidth(drag.startWidth - delta, liveMax)

        setPanelWidth((prev) => (prev === nextWidth ? prev : nextWidth))
      }

      const onUp = () => {
        finishResize()
      }

      listenersRef.current = { move: onMove, up: onUp }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [clearDragListeners, containerRef, finishResize, panelWidth],
  )

  return {
    panelWidth,
    maxWidth,
    canResize,
    isResizing,
    startResize,
    resetWidth,
  }
}
