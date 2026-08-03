import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Component } from '@/api/types'
import { cn, formatMm, normalizeManufacturer } from '@/lib/utils'

const COMPONENTS_TABLE_WIDTHS = {
  name: 180,
  manufacturer: 112,
  type: 112,
  part_number: 160,
  width: 72,
  height: 72,
  depth: 72,
  temp: 80,
  coated: 64,
} as const

// The trailing column only ever holds a "Yes" badge, so its spare width is the
// first thing other columns take when they grow. Keep enough for its header.
const COMPONENTS_TABLE_MIN_WIDTHS = { coated: 64 } as const

type ComponentsTableProps = {
  components: Component[]
  totalCount: number
  hasActiveFilters: boolean
  emptyFilterMessage: string
  selectedSerial: string | null
  panelOpen: boolean
  isCreatePanel: boolean
  onRowPointerDown: (e: ReactPointerEvent) => void
  onRowClick: (e: ReactMouseEvent, c: Component) => void
  onApplyManufacturerFilter: (manufacturer: string) => void
  onApplyTypeFilter: (type: string) => void
  manufacturerFilter: string | null
  typeFilter: string | null
  onClearAllFilters: () => void
}

export function ComponentsTable({
  components,
  totalCount,
  hasActiveFilters,
  emptyFilterMessage,
  selectedSerial,
  panelOpen,
  isCreatePanel,
  onRowPointerDown,
  onRowClick,
  onApplyManufacturerFilter,
  onApplyTypeFilter,
  manufacturerFilter,
  typeFilter,
  onClearAllFilters,
}: ComponentsTableProps) {
  return (
    <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
      <Table
        storageKey="foundry.table.components"
        defaultColumnWidths={COMPONENTS_TABLE_WIDTHS}
        minColumnWidths={COMPONENTS_TABLE_MIN_WIDTHS}
        containerClassName="overflow-visible"
      >
        <TableHeader>
          <TableRow className="text-xs">
            <TableHead columnId="name">Name</TableHead>
            <TableHead columnId="manufacturer">Manufacturer</TableHead>
            <TableHead columnId="type">Type</TableHead>
            <TableHead columnId="part_number">Part Number</TableHead>
            <TableHead columnId="width">Width</TableHead>
            <TableHead columnId="height">Height</TableHead>
            <TableHead columnId="depth">Depth</TableHead>
            <TableHead columnId="temp">Temp °C</TableHead>
            <TableHead columnId="coated">Coated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {totalCount === 0 && !hasActiveFilters && (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-xs text-muted-foreground py-8">
                No components yet. Add the first one.
              </TableCell>
            </TableRow>
          )}
          {totalCount === 0 && hasActiveFilters && (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-xs text-muted-foreground py-8">
                No components match{emptyFilterMessage}.{' '}
                <button
                  type="button"
                  className="underline underline-offset-2 hover:text-foreground"
                  onClick={onClearAllFilters}
                >
                  Clear filters
                </button>
              </TableCell>
            </TableRow>
          )}
          {components.map((c) => {
            const isSelected =
              !isCreatePanel && selectedSerial === c.serial_number && panelOpen
            return (
              <TableRow
                key={c.serial_number}
                className={`text-xs cursor-pointer ${
                  isSelected ? 'bg-muted' : 'hover:bg-muted/50'
                }`}
                onPointerDown={onRowPointerDown}
                onClick={(e) => onRowClick(e, c)}
              >
                <TableCell>{c.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {c.manufacturer ? (
                    <button
                      type="button"
                      className={cn(
                        'text-left transition-colors hover:text-foreground',
                        manufacturerFilter ===
                          normalizeManufacturer(c.manufacturer) &&
                          'font-medium text-foreground underline underline-offset-2',
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        onApplyManufacturerFilter(
                          normalizeManufacturer(c.manufacturer),
                        )
                      }}
                      title={`Filter by ${normalizeManufacturer(c.manufacturer)}`}
                    >
                      {normalizeManufacturer(c.manufacturer)}
                    </button>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[14px] py-0 px-1.5 bg-transparent hover:bg-transparent cursor-pointer transition-colors rounded-md',
                      typeFilter === c.type
                        ? 'border-foreground/40'
                        : 'hover:border-foreground/30',
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      onApplyTypeFilter(c.type)
                    }}
                    title={`Filter by ${c.type}`}
                  >
                    {c.type}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-muted-foreground">
                  {c.part_number || '—'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatMm(c.width_mm) ?? '—'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatMm(c.height_mm) ?? '—'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatMm(c.depth_mm) ?? '—'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {c.env_temp_c != null ? c.env_temp_c : '—'}
                </TableCell>
                <TableCell>
                  {c.env_coated ? (
                    <Badge variant="success" className="text-[10px] py-0 px-1.5">
                      Yes
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
