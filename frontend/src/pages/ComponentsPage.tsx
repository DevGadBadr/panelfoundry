import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PopupModal } from '@/components/ui/popup-modal'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ComponentForm } from '@/components/ComponentForm'
import { ComponentDetail } from '@/components/ComponentDetail'
import { componentsApi } from '@/api/components'
import type { Component } from '@/api/types'

type ModalMode = 'create' | 'edit' | null

export function ComponentsPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<ModalMode>(null)
  const [selected, setSelected] = useState<Component | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['components'],
    queryFn: () => componentsApi.list(),
  })

  const createMut = useMutation({
    mutationFn: (d: Partial<Component>) =>
      componentsApi.create(d as Omit<Component, 'created_at' | 'updated_at' | 'pricelist_id'>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['components'] })
      setModal(null)
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ sn, d }: { sn: string; d: Partial<Omit<Component, 'pricelist_id'>> }) =>
      componentsApi.update(sn, d),
    onSuccess: (_data, { sn, d }) => {
      qc.invalidateQueries({ queryKey: ['components'] })
      setModal(null)
      setSelected((prev) => (prev?.serial_number === sn ? { ...prev, ...d } : prev))
    },
  })

  const deleteMut = useMutation({
    mutationFn: (sn: string) => componentsApi.delete(sn),
    onSuccess: (_data, sn) => {
      qc.invalidateQueries({ queryKey: ['components'] })
      setSelected((prev) => (prev?.serial_number === sn ? null : prev))
    },
  })

  const openEdit = (c: Component, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelected(c)
    setModal('edit')
  }

  const confirmDelete = (c: Component, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Delete ${c.serial_number}?`)) deleteMut.mutate(c.serial_number)
  }

  const components = data?.results ?? []
  // Prefer fresh list data when available so the panel stays in sync
  const selectedLive =
    selected && (components.find((c) => c.serial_number === selected.serial_number) ?? selected)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div>
          <h1 className="text-base font-semibold">Components</h1>
          <p className="text-xs text-muted-foreground">
            {data?.count ?? 0} components in catalog
          </p>
        </div>
        <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => setModal('create')}>
          <Plus className="h-3.5 w-3.5" />
          Add Component
        </Button>
      </div>

      {/* Split: table + inline detail */}
      <div className="flex flex-1 min-h-0">
        <div className={`flex-1 overflow-auto ${selectedLive ? 'border-r' : ''}`}>
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
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="w-36">Serial Number</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-28">Type</TableHead>
                  <TableHead className="w-24 text-right">W × H (mm)</TableHead>
                  <TableHead className="w-20 text-center">Temp °C</TableHead>
                  <TableHead className="w-16 text-center">Coated</TableHead>
                  <TableHead className="w-16 text-right" />
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
                {components.map((c) => {
                  const isSelected = selectedLive?.serial_number === c.serial_number
                  return (
                    <TableRow
                      key={c.serial_number}
                      className={`text-xs cursor-pointer ${
                        isSelected ? 'bg-muted' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelected(c)}
                    >
                      <TableCell className="font-mono font-medium">{c.serial_number}</TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                          {c.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {c.width_mm && c.height_mm
                          ? `${c.width_mm} × ${c.height_mm}`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {c.env_temp_c != null ? c.env_temp_c : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        {c.env_coated ? (
                          <Badge className="text-[10px] py-0 px-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            Yes
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => openEdit(c, e)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={(e) => confirmDelete(c, e)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {selectedLive && (
          <aside className="w-[420px] shrink-0 flex flex-col overflow-hidden bg-background">
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b">
              <h2 className="text-sm font-mono font-medium truncate">
                {selectedLive.serial_number}
              </h2>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0"
                onClick={() => setSelected(null)}
                aria-label="Close detail panel"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <ComponentDetail component={selectedLive} />
            </div>
          </aside>
        )}
      </div>

      {/* Modal — Create */}
      <PopupModal
        open={modal === 'create'}
        onOpenChange={(o) => !o && setModal(null)}
        title="New Component"
        size="sm"
      >
        <ComponentForm
          onSubmit={(d) => createMut.mutateAsync(d)}
          onCancel={() => setModal(null)}
        />
      </PopupModal>

      {/* Modal — Edit */}
      <PopupModal
        open={modal === 'edit'}
        onOpenChange={(o) => !o && setModal(null)}
        title={selected ? `Edit — ${selected.serial_number}` : 'Edit Component'}
        size="sm"
      >
        {selected && (
          <ComponentForm
            initial={selected}
            isEdit
            onSubmit={(d) => updateMut.mutateAsync({ sn: selected.serial_number, d })}
            onCancel={() => setModal(null)}
          />
        )}
      </PopupModal>
    </div>
  )
}
