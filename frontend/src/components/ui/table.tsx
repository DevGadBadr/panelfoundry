import * as React from "react"

import { cn } from "@/lib/utils"
import {
  useColumnWidths,
  type ColumnWidths,
} from "@/hooks/useColumnWidths"
import { ResizeHandle } from "@/components/ui/resize-handle"

/* -------------------------------------------------------------------------- */
/* Column resize context                                                      */
/* -------------------------------------------------------------------------- */

type ColumnResizeContextValue = {
  widths: ColumnWidths
  columnIds: string[]
  startResize: (columnId: string, clientX: number) => void
  canResizeColumn: (columnId: string) => boolean
  activeColumnId: string | null
  setActiveColumnId: (id: string | null) => void
}

const ColumnResizeContext = React.createContext<ColumnResizeContextValue | null>(
  null,
)

function useColumnResize() {
  return React.useContext(ColumnResizeContext)
}

/* -------------------------------------------------------------------------- */
/* Table                                                                      */
/* -------------------------------------------------------------------------- */

type TableProps = React.ComponentProps<"table"> & {
  /**
   * Unique localStorage key for persisting column widths.
   * When set with `defaultColumnWidths`, enables resizable columns.
   */
  storageKey?: string
  /** Default / relative widths keyed by column id (key order = column order). */
  defaultColumnWidths?: ColumnWidths
  /** Minimum column width in px while resizing. */
  minColumnWidth?: number
  /**
   * Per-column minimum widths, for columns that need more room than the rest —
   * a last column that should always show its header, for instance.
   */
  minColumnWidths?: ColumnWidths
  /**
   * Classes for the scroll container wrapping the table. Resizable tables
   * clip horizontally by default (columns always fit the container); pass
   * `overflow-visible` to let an ancestor scroll area own overflow instead.
   */
  containerClassName?: string
}

function Table({
  storageKey,
  defaultColumnWidths,
  minColumnWidth,
  minColumnWidths,
  className,
  containerClassName,
  ...props
}: TableProps) {
  if (storageKey && defaultColumnWidths) {
    return (
      <ResizableTable
        storageKey={storageKey}
        defaultColumnWidths={defaultColumnWidths}
        minColumnWidth={minColumnWidth}
        minColumnWidths={minColumnWidths}
        className={className}
        containerClassName={containerClassName}
        {...props}
      />
    )
  }
  return (
    <TableRoot
      className={cn("w-full", className)}
      containerClassName={containerClassName}
      {...props}
    />
  )
}

function TableRoot({
  className,
  containerClassName,
  children,
  colgroup,
  containerRef,
  ...props
}: React.ComponentProps<"table"> & {
  colgroup?: React.ReactNode
  containerRef?: React.Ref<HTMLDivElement>
  containerClassName?: string
}) {
  return (
    <div
      ref={containerRef}
      data-slot="table-container"
      className={cn("relative w-full", containerClassName ?? "overflow-hidden")}
    >
      <table
        data-slot="table"
        className={cn("caption-bottom text-sm", className)}
        {...props}
      >
        {colgroup}
        {children}
      </table>
    </div>
  )
}

function ResizableTable({
  storageKey,
  defaultColumnWidths,
  minColumnWidth,
  minColumnWidths,
  className,
  containerClassName,
  children,
  style,
  ...props
}: TableProps & {
  storageKey: string
  defaultColumnWidths: ColumnWidths
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = React.useState(0)

  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const readWidth = (entry?: ResizeObserverEntry) => {
      // Prefer the content box from the observer so a scrollbar on this (or a
      // parent) element cannot feed back into the measured width and cause a
      // fit ↔ scrollbar flicker loop.
      const box = entry?.contentBoxSize
      const size = Array.isArray(box) ? box[0] : box
      const fromBox = size && "inlineSize" in size ? size.inlineSize : undefined
      const raw =
        typeof fromBox === "number" && Number.isFinite(fromBox)
          ? fromBox
          : (entry?.contentRect.width ?? el.getBoundingClientRect().width)
      return Math.floor(raw)
    }

    const update = (entries?: ResizeObserverEntry[]) => {
      const next = readWidth(entries?.[0])
      setContainerWidth((prev) => (prev === next ? prev : next))
    }
    update()

    const observer = new ResizeObserver((entries) => update(entries))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const { widths, totalWidth, columnIds, startResize, canResizeColumn } = useColumnWidths({
    storageKey,
    defaultWidths: defaultColumnWidths,
    minWidth: minColumnWidth,
    minWidths: minColumnWidths,
    containerWidth,
  })
  const [activeColumnId, setActiveColumnId] = React.useState<string | null>(null)

  const ctx = React.useMemo<ColumnResizeContextValue>(
    () => ({
      widths,
      columnIds,
      startResize,
      canResizeColumn,
      activeColumnId,
      setActiveColumnId,
    }),
    [widths, columnIds, startResize, canResizeColumn, activeColumnId],
  )

  return (
    <ColumnResizeContext.Provider value={ctx}>
      <TableRoot
        containerRef={containerRef}
        className={cn("table-fixed", className)}
        containerClassName={containerClassName ?? "overflow-x-hidden overflow-y-hidden"}
        style={{ ...style, width: totalWidth > 0 ? totalWidth : undefined }}
        colgroup={
          <colgroup>
            {columnIds.map((id) => (
              <col key={id} style={{ width: `${widths[id]}px` }} />
            ))}
          </colgroup>
        }
        {...props}
      >
        {children}
      </TableRoot>
    </ColumnResizeContext.Provider>
  )
}

/* -------------------------------------------------------------------------- */
/* Structural pieces                                                          */
/* -------------------------------------------------------------------------- */

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------- */
/* TableHead + thin resize handle                                             */
/* -------------------------------------------------------------------------- */

type TableHeadProps = React.ComponentProps<"th"> & {
  /** Column id used for width state / localStorage. */
  columnId?: string
  /** Show resize handle on the right border. Default true when columnId is set. */
  resizable?: boolean
}

function TableHead({
  className,
  columnId,
  resizable,
  children,
  ...props
}: TableHeadProps) {
  const ctx = useColumnResize()
  const canResize = Boolean(
    ctx && columnId && (resizable ?? true) && ctx.canResizeColumn(columnId),
  )
  const isActive = ctx?.activeColumnId === columnId

  return (
    <th
      data-slot="table-head"
      data-column-id={columnId}
      className={cn(
        "relative h-10 overflow-hidden px-2 text-left align-middle font-medium text-ellipsis whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    >
      {children}
      {canResize && columnId && ctx && (
        <ColumnResizeHandle
          columnId={columnId}
          active={isActive}
          onDragStart={ctx.startResize}
          onActiveChange={ctx.setActiveColumnId}
        />
      )}
    </th>
  )
}

/** Light, thin vertical handle on the column border. */
function ColumnResizeHandle({
  columnId,
  active,
  onDragStart,
  onActiveChange,
}: {
  columnId: string
  active: boolean
  onDragStart: (columnId: string, clientX: number) => void
  onActiveChange: (id: string | null) => void
}) {
  return (
    <ResizeHandle
      label={`Resize ${columnId} column`}
      active={active}
      className="right-0"
      onMouseEnter={() => onActiveChange(columnId)}
      onMouseLeave={() => {
        if (document.body.style.cursor !== "col-resize") {
          onActiveChange(null)
        }
      }}
      onDragStart={(clientX) => {
        onActiveChange(columnId)
        onDragStart(columnId, clientX)

        const clearActive = () => {
          onActiveChange(null)
          window.removeEventListener("mouseup", clearActive)
        }
        window.addEventListener("mouseup", clearActive)
      }}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap overflow-hidden text-ellipsis [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
