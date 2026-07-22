import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, X, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PopupModal } from '@/components/ui/popup-modal'
import { DialogFooter } from '@/components/ui/dialog'
import { ComponentForm } from '@/components/ComponentForm'
import { ComponentDetail } from '@/components/ComponentDetail'
import { SerialNumberLabel } from '@/components/SerialNumberLabel'
import { componentsApi } from '@/api/components'
import type { Component } from '@/api/types'
import {
  loadPanelState,
  savePanelState,
  type PanelMode,
} from '@/lib/panelStorage'
import { usePanelWidth } from '@/hooks/usePanelWidth'
import { cn } from '@/lib/utils'

const COMPONENTS_TABLE_WIDTHS = {
  serial_number: 180,
  name: 180,
  manufacturer: 112,
  type: 112,
  dimensions: 96,
  temp: 80,
  coated: 64,
} as const

const PANEL_TRANSITION_MS = 300
const TYPE_FILTER_ALL = '__all__'

function matchesComponentSearch(c: Component, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    c.serial_number.toLowerCase().includes(q) ||
    c.name.toLowerCase().includes(q)
  )
}

const restored = loadPanelState()

export function ComponentsPage() {
  const qc = useQueryClient()
  const [panel, setPanel] = useState<PanelMode | null>(restored?.panel ?? null)
  const [selectedSerial, setSelectedSerial] = useState<string | null>(
    restored?.selectedSerial ?? null,
  )
  const [draft, setDraft] = useState<Partial<Component> | null>(
    restored?.draft ?? null,
  )
  const [panelClosing, setPanelClosing] = useState(false)
  const [transitionsReady, setTransitionsReady] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Component | null>(null)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rowPointerRef = useRef<{ x: number; y: number } | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const splitRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['components'],
    queryFn: () => componentsApi.list(),
  })

  const components = data?.results ?? []

  const availableTypes = useMemo(
    () =>
      [...new Set(components.map((c) => c.type).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [components],
  )

  const filtered = useMemo(() => {
    let result = components
    if (typeFilter) {
      result = result.filter((c) => c.type === typeFilter)
    }
    if (searchQuery.trim()) {
      result = result.filter((c) => matchesComponentSearch(c, searchQuery))
    }
    return result
  }, [components, typeFilter, searchQuery])

  const hasActiveFilters = typeFilter !== null || searchQuery.trim().length > 0
  const searchExpanded = searchFocused || searchQuery.length > 0

  const selected = useMemo(() => {
    if (!selectedSerial) return null
    return components.find((c) => c.serial_number === selectedSerial) ?? null
  }, [components, selectedSerial])

  // Enable CSS transitions after first paint so restored panels don't slide in.
  useEffect(() => {
    const id = requestAnimationFrame(() => setTransitionsReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [])

  const clearPanelState = useCallback(() => {
    setSelectedSerial(null)
    setDraft(null)
    setPanel(null)
    setPanelClosing(false)
  }, [])

  const cancelCloseAnimation = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setPanelClosing(false)
  }, [])

  // Persist panel state whenever it changes. Only cleared on manual dismiss.
  useEffect(() => {
    if (!panel || panelClosing) {
      savePanelState(null)
      return
    }
    savePanelState({
      panel,
      selectedSerial,
      draft: panel === 'create' || panel === 'edit' ? draft : null,
    })
  }, [panel, selectedSerial, draft, panelClosing])

  // If restored detail/edit points at a deleted component, drop the panel.
  useEffect(() => {
    if (isLoading || !data) return
    if ((panel === 'detail' || panel === 'edit') && selectedSerial && !selected) {
      cancelCloseAnimation()
      clearPanelState()
    }
  }, [isLoading, data, panel, selectedSerial, selected, cancelCloseAnimation, clearPanelState])

  const persistDraft = useCallback((next: Partial<Component>) => {
    setDraft(next)
  }, [])

  const createMut = useMutation({
    mutationFn: (d: Partial<Component>) =>
      componentsApi.create(d as Omit<Component, 'created_at' | 'updated_at' | 'pricelist_id'>),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['components'] })
      cancelCloseAnimation()
      setDraft(null)
      setSelectedSerial(created.serial_number)
      setPanel('detail')
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ sn, d }: { sn: string; d: Partial<Omit<Component, 'pricelist_id'>> }) =>
      componentsApi.update(sn, d),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['components'] })
      cancelCloseAnimation()
      setDraft(null)
      setSelectedSerial(updated.serial_number)
      setPanel('detail')
    },
  })

  const deleteMut = useMutation({
    mutationFn: (sn: string) => componentsApi.delete(sn),
    onSuccess: (_data, sn) => {
      qc.invalidateQueries({ queryKey: ['components'] })
      setDeleteTarget(null)
      if (selectedSerial === sn) {
        cancelCloseAnimation()
        clearPanelState()
      }
    },
  })

  const panelMounted = panel !== null
  const panelOpen = panelMounted && !panelClosing

  const {
    panelWidth,
    canResize,
    isResizing,
    startResize,
    resetWidth,
  } = usePanelWidth(splitRef, panelOpen)

  const openCreate = () => {
    cancelCloseAnimation()
    resetWidth()
    setSelectedSerial(null)
    setDraft(null)
    setPanel('create')
  }

  const openEdit = (c: Component) => {
    cancelCloseAnimation()
    resetWidth()
    setDraft(null)
    setSelectedSerial(c.serial_number)
    setPanel('edit')
  }

  const closePanel = () => {
    if (!panel || panelClosing) return
    setPanelClosing(true)
    savePanelState(null)
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null
      clearPanelState()
    }, PANEL_TRANSITION_MS)
  }

  const openDetail = (c: Component) => {
    // Clicking the already-selected row dismisses the panel.
    if (
      !panelClosing &&
      selectedSerial === c.serial_number &&
      (panel === 'detail' || panel === 'edit')
    ) {
      closePanel()
      return
    }
    cancelCloseAnimation()
    resetWidth()
    setDraft(null)
    setSelectedSerial(c.serial_number)
    setPanel('detail')
  }

  // Only open on a clean single click — not drag-to-select or multi-click.
  const ROW_DRAG_THRESHOLD_PX = 5

  const onRowPointerDown = (e: ReactPointerEvent) => {
    if (e.button !== 0) {
      rowPointerRef.current = null
      return
    }
    rowPointerRef.current = { x: e.clientX, y: e.clientY }
  }

  const onRowClick = (e: ReactMouseEvent, c: Component) => {
    if (e.detail !== 1) return

    const start = rowPointerRef.current
    rowPointerRef.current = null
    if (start) {
      const dx = Math.abs(e.clientX - start.x)
      const dy = Math.abs(e.clientY - start.y)
      if (dx > ROW_DRAG_THRESHOLD_PX || dy > ROW_DRAG_THRESHOLD_PX) return
    }

    const sel = window.getSelection()
    if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) return

    openDetail(c)
  }

  const cancelEdit = () => {
    setDraft(null)
    setPanel('detail')
  }

  const requestDelete = (c: Component) => {
    setDeleteTarget(c)
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    deleteMut.mutate(deleteTarget.serial_number)
  }

  const applyTypeFilter = (type: string) => {
    setTypeFilter(type)
  }

  const clearAllFilters = () => {
    setTypeFilter(null)
    setSearchQuery('')
  }

  const clearTypeFilter = () => {
    setTypeFilter(null)
  }

  const panelTitle =
    panel === 'create'
      ? 'New Component'
      : panel === 'edit'
        ? selected
          ? `Edit — ${selected.name}`
          : 'Edit'
        : selected?.name ?? ''

  const panelSubtitle =
    panel === 'detail' && selected ? (
      <SerialNumberLabel
        serial={selected.serial_number}
        isGenerated={selected.serial_is_generated}
        className="text-xs text-muted-foreground"
      />
    ) : null

  // Form initial: prefer persisted draft over live component.
  const formInitial =
    draft ??
    (panel === 'edit' && selected ? selected : undefined)

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border/80 px-4 py-3">
        <div className="min-w-0">
          <h1 className="text-base font-semibold">Components</h1>
          <p className="text-xs text-muted-foreground">
            {hasActiveFilters
              ? `${filtered.length} of ${data?.count ?? 0} components`
              : `${data?.count ?? 0} components in catalog`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Type</span>
            <div
              className={cn(
                'flex items-stretch overflow-hidden rounded-[min(var(--radius-md),12px)] border border-input bg-transparent dark:bg-input/30',
                typeFilter && 'pr-0',
              )}
            >
              <Select
                value={typeFilter ?? TYPE_FILTER_ALL}
                onValueChange={(value) =>
                  setTypeFilter(value === TYPE_FILTER_ALL ? null : (value as string))
                }
              >
                <SelectTrigger
                  size="sm"
                  className={cn(
                    'h-7 w-[7.25rem] max-w-[7.25rem] min-w-0 gap-1.5 border-0 bg-transparent px-2 text-xs shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent',
                    typeFilter && 'rounded-none rounded-l-[min(var(--radius-md),12px)]',
                  )}
                  aria-label="Select component type"
                >
                  <SelectValue
                    placeholder="All"
                    className="min-w-0 truncate text-left"
                  >
                    {(value) =>
                      !value || value === TYPE_FILTER_ALL ? 'All' : String(value)
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value={TYPE_FILTER_ALL}>All</SelectItem>
                  {availableTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {typeFilter && (
                <button
                  type="button"
                  className="flex h-7 w-7 shrink-0 items-center justify-center border-l border-input text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  onClick={clearTypeFilter}
                  aria-label={`Clear type filter: ${typeFilter}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div
            className={cn(
              'relative flex h-7 items-center gap-1.5 overflow-hidden rounded-[min(var(--radius-md),12px)] border border-input bg-transparent px-2 transition-[width] duration-200 ease-out dark:bg-input/30',
              searchExpanded
                ? 'w-52'
                : 'w-[5.25rem] cursor-pointer hover:bg-muted/50 dark:hover:bg-input/50',
            )}
            onClick={() => {
              if (!searchExpanded) searchInputRef.current?.focus()
            }}
          >
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            {!searchExpanded && (
              <span className="text-xs text-muted-foreground select-none">Search</span>
            )}
            <Input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Serial or name…"
              className={cn(
                'h-7 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent',
                searchExpanded ? 'min-w-0 flex-1' : 'sr-only',
              )}
              aria-label="Search components by serial number or name"
            />
            {searchExpanded && searchQuery && (
              <button
                type="button"
                className="shrink-0 rounded-sm p-0.5 text-muted-foreground opacity-70 hover:text-foreground hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation()
                  setSearchQuery('')
                  searchInputRef.current?.focus()
                }}
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <Button size="sm" className="h-7 gap-1 text-xs" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
            Add Component
          </Button>
        </div>
      </div>

      {/* Split: table + side panel share one continuous bg */}
      <div
        ref={splitRef}
        className="flex flex-1 min-h-0 overflow-hidden bg-background"
      >
        <div className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              Loading…
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-32 text-sm text-destructive">
              Failed to load components. Is the API running?
            </div>
          )}
          {!isLoading && !error && (
            <Table
              storageKey="foundry.table.components"
              defaultColumnWidths={COMPONENTS_TABLE_WIDTHS}
            >
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead columnId="serial_number">Serial Number</TableHead>
                  <TableHead columnId="name">Name</TableHead>
                  <TableHead columnId="manufacturer">Manufacturer</TableHead>
                  <TableHead columnId="type">Type</TableHead>
                  <TableHead columnId="dimensions">W × H (mm)</TableHead>
                  <TableHead columnId="temp">Temp °C</TableHead>
                  <TableHead columnId="coated">Coated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {components.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">
                      No components yet. Add the first one.
                    </TableCell>
                  </TableRow>
                )}
                {components.length > 0 && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">
                      No components match
                      {searchQuery.trim() && typeFilter
                        ? ' your search and type filter'
                        : searchQuery.trim()
                          ? ' your search'
                          : ` type “${typeFilter}”`}
                      .{' '}
                      <button
                        type="button"
                        className="underline underline-offset-2 hover:text-foreground"
                        onClick={clearAllFilters}
                      >
                        Clear filters
                      </button>
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((c) => {
                  const isSelected =
                    panel !== 'create' && selectedSerial === c.serial_number && panelOpen
                  return (
                    <TableRow
                      key={c.serial_number}
                      className={`text-xs cursor-pointer ${
                        isSelected ? 'bg-muted' : 'hover:bg-muted/50'
                      }`}
                      onPointerDown={onRowPointerDown}
                      onClick={(e) => onRowClick(e, c)}
                    >
                      <TableCell>
                        <SerialNumberLabel
                          serial={c.serial_number}
                          isGenerated={c.serial_is_generated}
                          className="text-xs"
                        />
                      </TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.manufacturer || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-[10px] py-0 px-1.5 cursor-pointer transition-colors',
                            typeFilter === c.type
                              ? 'ring-1 ring-foreground/20'
                              : 'hover:bg-secondary/80',
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            applyTypeFilter(c.type)
                          }}
                          title={`Filter by ${c.type}`}
                        >
                          {c.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.width_mm && c.height_mm
                          ? `${c.width_mm} × ${c.height_mm}`
                          : '—'}
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
          )}
        </div>

        <aside
          className={cn(
            'flex min-h-0 shrink-0 flex-col overflow-hidden',
            transitionsReady &&
              !isResizing &&
              'transition-[width] duration-300 ease-in-out',
          )}
          style={{ width: panelOpen ? panelWidth : 0 }}
          aria-hidden={!panelOpen}
        >
          <div
            className={cn(
              'relative flex h-full min-h-0 flex-col bg-card dark:shadow-[-12px_0_24px_-16px_rgba(0,0,0,0.55)]',
              transitionsReady && 'transition-transform duration-300 ease-in-out',
              panelOpen ? 'translate-x-0' : 'translate-x-full',
            )}
            style={{ width: panelWidth }}
          >
            {panelOpen && canResize && (
              <PanelResizeHandle
                active={isResizing}
                onDragStart={startResize}
              />
            )}
            {panelMounted && (
              <div className="flex min-h-0 flex-1 flex-col border-l border-border/80">
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/80 px-6 py-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-medium">
                      {panelTitle}
                    </h2>
                    {panelSubtitle}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {panel === 'detail' && selected && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={() => openEdit(selected)}
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={closePanel}
                      aria-label="Close panel"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
                  {panel === 'create' && (
                    <ComponentForm
                      key="create"
                      initial={draft ?? undefined}
                      onChange={persistDraft}
                      onSubmit={(d) => createMut.mutateAsync(d)}
                      onCancel={closePanel}
                    />
                  )}
                  {panel === 'edit' && selectedSerial && (
                    // Wait for component to resolve from list when restoring after reload
                    selected ? (
                      <ComponentForm
                        key={`edit-${selectedSerial}`}
                        initial={formInitial}
                        isEdit
                        onChange={persistDraft}
                        onSubmit={(d) =>
                          updateMut.mutateAsync({ sn: selectedSerial, d })
                        }
                        onCancel={cancelEdit}
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground">Loading…</p>
                    )
                  )}
                  {panel === 'detail' && (
                    selected ? (
                      <ComponentDetail
                        component={selected}
                        onDelete={() => requestDelete(selected)}
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground">Loading…</p>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      <PopupModal
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleteMut.isPending) setDeleteTarget(null)
        }}
        title="Delete component?"
        description={
          deleteTarget
            ? (
                <span>
                  This will permanently delete{' '}
                  <SerialNumberLabel
                    serial={deleteTarget.serial_number}
                    isGenerated={deleteTarget.serial_is_generated}
                    className="inline-flex"
                  />
                  . This action cannot be undone.
                </span>
              )
            : undefined
        }
        size="sm"
      >
        <DialogFooter className="mt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={deleteMut.isPending}
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={deleteMut.isPending}
            onClick={handleConfirmDelete}
          >
            {deleteMut.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </PopupModal>
    </div>
  )
}

function PanelResizeHandle({
  active,
  onDragStart,
}: {
  active: boolean
  onDragStart: (clientX: number) => void
}) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize panel"
      data-slot="panel-resize-handle"
      className={cn(
        'absolute top-0 left-0 z-10 h-full w-2.5 -translate-x-1/2 cursor-col-resize touch-none select-none',
        'after:pointer-events-none after:absolute after:inset-y-1.5 after:left-1/2 after:w-px after:-translate-x-1/2 after:rounded-full after:bg-border/50 after:transition-colors',
        'hover:after:bg-foreground/20',
        active && 'after:bg-foreground/30',
      )}
      onMouseDown={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onDragStart(event.clientX)
      }}
    />
  )
}
