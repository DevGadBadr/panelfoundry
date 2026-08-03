import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ComponentForm } from '@/components/ComponentForm'
import { ComponentDetail } from '@/components/ComponentDetail'
import { SerialNumberLabel } from '@/components/SerialNumberLabel'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ComponentsToolbar } from '@/components/components/ComponentsToolbar'
import { ComponentsTable } from '@/components/components/ComponentsTable'
import { ComponentsPagination } from '@/components/components/ComponentsPagination'
import { ComponentSidePanel } from '@/components/components/ComponentSidePanel'
import { componentsApi } from '@/api/components'
import type { Component } from '@/api/types'
import {
  loadPanelState,
  savePanelState,
  type PanelMode,
} from '@/lib/panelStorage'
import { usePanelWidth } from '@/hooks/usePanelWidth'
import { DEFAULT_PAGE_SIZE, getPaginationItems } from '@/lib/pagination'

const PANEL_TRANSITION_MS = 300
const ROW_DRAG_THRESHOLD_PX = 5

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
  const [manufacturerFilter, setManufacturerFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rowPointerRef = useRef<{ x: number; y: number } | null>(null)
  const splitRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    setPage(1)
  }, [typeFilter, manufacturerFilter, debouncedSearch, pageSize])

  const listParams = useMemo(
    () => ({
      page,
      page_size: pageSize,
      type: typeFilter,
      manufacturer: manufacturerFilter,
      search: debouncedSearch,
    }),
    [page, pageSize, typeFilter, manufacturerFilter, debouncedSearch],
  )

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['components', listParams],
    queryFn: () => componentsApi.list(listParams),
    placeholderData: (prev) => prev,
  })

  const { data: facets } = useQuery({
    queryKey: ['components', 'facets'],
    queryFn: () => componentsApi.facets(),
  })

  const components = data?.results ?? []
  const totalCount = data?.count ?? 0
  const catalogCount = facets?.count ?? totalCount
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const pageItems = getPaginationItems(page, totalPages)

  useEffect(() => {
    if (!data) return
    if (page > totalPages) setPage(totalPages)
  }, [data, page, totalPages])

  const availableTypes = facets?.types ?? []
  const availableManufacturers = facets?.manufacturers ?? []

  const hasActiveFilters =
    typeFilter !== null ||
    manufacturerFilter !== null ||
    searchQuery.trim().length > 0

  const selectedFromPage = useMemo(() => {
    if (!selectedSerial) return null
    return components.find((c) => c.serial_number === selectedSerial) ?? null
  }, [components, selectedSerial])

  const needsSelectedFetch =
    (panel === 'detail' || panel === 'edit') &&
    !!selectedSerial &&
    !selectedFromPage

  const {
    data: selectedFetched,
    isError: selectedFetchError,
    isLoading: selectedFetchLoading,
  } = useQuery({
    queryKey: ['components', 'detail', selectedSerial],
    queryFn: () => componentsApi.get(selectedSerial!),
    enabled: needsSelectedFetch,
    retry: false,
  })

  const selected = selectedFromPage ?? (needsSelectedFetch ? selectedFetched ?? null : null)

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

  // If detail/edit points at a deleted component, drop the panel.
  useEffect(() => {
    if (!needsSelectedFetch || selectedFetchLoading) return
    if (selectedFetchError) {
      cancelCloseAnimation()
      clearPanelState()
    }
  }, [
    needsSelectedFetch,
    selectedFetchLoading,
    selectedFetchError,
    cancelCloseAnimation,
    clearPanelState,
  ])

  const persistDraft = useCallback((next: Partial<Component>) => {
    setDraft(next)
  }, [])

  const invalidateComponents = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['components'] })
  }, [qc])

  const createMut = useMutation({
    mutationFn: (d: Partial<Component>) =>
      componentsApi.create(d as Omit<Component, 'created_at' | 'updated_at' | 'pricelist_id'>),
    onSuccess: (created) => {
      invalidateComponents()
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
      invalidateComponents()
      cancelCloseAnimation()
      setDraft(null)
      setSelectedSerial(updated.serial_number)
      setPanel('detail')
    },
  })

  const deleteMut = useMutation({
    mutationFn: (sn: string) => componentsApi.delete(sn),
    onSuccess: (_data, sn) => {
      invalidateComponents()
      setDeleteTarget(null)
      if (selectedSerial === sn) {
        cancelCloseAnimation()
        clearPanelState()
      }
    },
  })

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, totalCount)
  const showPager = !isLoading && !error && totalPages > 1

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

  const applyTypeFilter = (type: string) => {
    setTypeFilter(type)
    setPage(1)
  }

  const applyManufacturerFilter = (manufacturer: string) => {
    setManufacturerFilter(manufacturer)
    setPage(1)
  }

  const clearAllFilters = () => {
    setTypeFilter(null)
    setManufacturerFilter(null)
    setSearchQuery('')
    setPage(1)
  }

  const clearTypeFilter = () => {
    setTypeFilter(null)
    setPage(1)
  }

  const clearManufacturerFilter = () => {
    setManufacturerFilter(null)
    setPage(1)
  }

  const emptyFilterMessage = (() => {
    const parts: string[] = []
    if (searchQuery.trim()) parts.push('search')
    if (typeFilter) parts.push('type')
    if (manufacturerFilter) parts.push('manufacturer')
    if (parts.length > 1) return ' your current filters'
    if (searchQuery.trim()) return ' your search'
    if (typeFilter) return ` type “${typeFilter}”`
    if (manufacturerFilter) return ` manufacturer “${manufacturerFilter}”`
    return ' your filters'
  })()

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
      <ComponentsToolbar
        totalCount={totalCount}
        catalogCount={catalogCount}
        hasActiveFilters={hasActiveFilters}
        pageSize={pageSize}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
        manufacturerFilter={manufacturerFilter}
        onManufacturerFilterChange={(value) => {
          setManufacturerFilter(value)
          setPage(1)
        }}
        onClearManufacturerFilter={clearManufacturerFilter}
        availableManufacturers={availableManufacturers}
        typeFilter={typeFilter}
        onTypeFilterChange={(value) => {
          setTypeFilter(value)
          setPage(1)
        }}
        onClearTypeFilter={clearTypeFilter}
        availableTypes={availableTypes}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        searchFocused={searchFocused}
        onSearchFocusedChange={setSearchFocused}
        onAddComponent={openCreate}
      />

      <div
        ref={splitRef}
        className="flex flex-1 min-h-0 overflow-hidden bg-background"
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
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
            <>
              <ComponentsTable
                components={components}
                totalCount={totalCount}
                hasActiveFilters={hasActiveFilters}
                emptyFilterMessage={emptyFilterMessage}
                selectedSerial={selectedSerial}
                panelOpen={panelOpen}
                isCreatePanel={panel === 'create'}
                onRowPointerDown={onRowPointerDown}
                onRowClick={onRowClick}
                onApplyManufacturerFilter={applyManufacturerFilter}
                onApplyTypeFilter={applyTypeFilter}
                manufacturerFilter={manufacturerFilter}
                typeFilter={typeFilter}
                onClearAllFilters={clearAllFilters}
              />
              <ComponentsPagination
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                totalCount={totalCount}
                pageCount={components.length}
                isFetching={isFetching}
                showPager={showPager}
                page={page}
                pageItems={pageItems}
                onPageChange={setPage}
              />
            </>
          )}
        </div>

        <ComponentSidePanel
          panelOpen={panelOpen}
          panelMounted={panelMounted}
          panelWidth={panelWidth}
          canResize={canResize}
          isResizing={isResizing}
          transitionsReady={transitionsReady}
          title={panelTitle}
          subtitle={panelSubtitle}
          showEdit={panel === 'detail' && !!selected}
          onEdit={() => selected && openEdit(selected)}
          onClose={closePanel}
          onStartResize={startResize}
        >
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
                onDelete={() => setDeleteTarget(selected)}
              />
            ) : (
              <p className="text-xs text-muted-foreground">Loading…</p>
            )
          )}
        </ComponentSidePanel>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleteMut.isPending) setDeleteTarget(null)
        }}
        title="Delete component?"
        description={
          deleteTarget ? (
            <span>
              This will permanently delete{' '}
              <SerialNumberLabel
                serial={deleteTarget.serial_number}
                isGenerated={deleteTarget.serial_is_generated}
                className="inline-flex"
              />
              . This action cannot be undone.
            </span>
          ) : undefined
        }
        pending={deleteMut.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMut.mutate(deleteTarget.serial_number)
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
