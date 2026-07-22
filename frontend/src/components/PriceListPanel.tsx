import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, CircleMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { PopupModal } from '@/components/ui/popup-modal'
import { DialogFooter } from '@/components/ui/dialog'
import { componentsApi } from '@/api/components'
import type { Currency, PriceListEntry } from '@/api/types'
import { cn } from '@/lib/utils'

interface Props {
  serialNumber: string
}

type PriceFields = {
  price: string
  quantity: string
  order_time: string
  currency: Currency
}

const EMPTY_FIELDS: PriceFields = { price: '', quantity: '1', order_time: '', currency: 'EUR' }

const PRICE_TABLE_WIDTHS = {
  order_time: 120,
  price: 88,
  quantity: 56,
  total: 88,
  actions: 72,
} as const

const fmtDate = (iso: string) => {
  try {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString()
  } catch {
    return iso
  }
}

const fmtNum = (value: string | number) => {
  const n = typeof value === 'number' ? value : parseFloat(value)
  if (Number.isNaN(n)) return String(value)
  return String(n)
}

const toDateInput = (iso: string) => iso.slice(0, 10)

const entryToFields = (e: PriceListEntry): PriceFields => ({
  price: fmtNum(e.price),
  quantity: String(e.quantity),
  order_time: toDateInput(e.order_time),
  currency: e.currency ?? 'EUR',
})

const fmtMoney = (value: string | number, currency: Currency) => {
  const n = typeof value === 'number' ? value : parseFloat(value)
  if (Number.isNaN(n)) return `${String(value)} ${currency}`
  return `${n.toFixed(2)} ${currency}`
}

function PriceFieldsForm({
  values,
  onChange,
  idPrefix,
}: {
  values: PriceFields
  onChange: (next: PriceFields) => void
  idPrefix: string
}) {
  const set = <K extends keyof PriceFields>(key: K, value: PriceFields[K]) =>
    onChange({ ...values, [key]: value })

  const total =
    Number.isFinite(parseFloat(values.price)) &&
    Number.isFinite(parseInt(values.quantity, 10))
      ? parseFloat(values.price) * parseInt(values.quantity, 10)
      : null

  return (
    <div className="flex flex-col gap-4 pt-1">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-date`} className="text-xs text-muted-foreground">
          Order Date
        </Label>
        <Input
          id={`${idPrefix}-date`}
          type="date"
          required
          value={values.order_time}
          onChange={(e) => set('order_time', e.target.value)}
          className="h-9 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-price`} className="text-xs text-muted-foreground">
            Price
          </Label>
          <Input
            id={`${idPrefix}-price`}
            type="number"
            step="any"
            min="0"
            required
            value={values.price}
            onChange={(e) => set('price', e.target.value)}
            className="h-9 text-sm font-mono"
            placeholder="0"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-currency`} className="text-xs text-muted-foreground">
            Currency
          </Label>
          <select
            id={`${idPrefix}-currency`}
            value={values.currency}
            onChange={(e) => set('currency', e.target.value as Currency)}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-qty`} className="text-xs text-muted-foreground">
            Quantity
          </Label>
          <Input
            id={`${idPrefix}-qty`}
            type="number"
            min="1"
            required
            value={values.quantity}
            onChange={(e) => set('quantity', e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5 justify-end">
          <div className="rounded-md border bg-muted/40 px-3 py-2.5 flex items-center justify-between h-9">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-sm font-mono font-medium">
              {total != null ? fmtMoney(total, values.currency) : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PriceListPanel({ serialNumber }: Props) {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<PriceFields>(EMPTY_FIELDS)
  const [createError, setCreateError] = useState('')
  const [editTarget, setEditTarget] = useState<PriceListEntry | null>(null)
  const [editForm, setEditForm] = useState<PriceFields>(EMPTY_FIELDS)
  const [editError, setEditError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<PriceListEntry | null>(null)

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['prices', serialNumber],
    queryFn: () => componentsApi.listPrices(serialNumber),
  })

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ['prices', serialNumber] })

  const addMut = useMutation({
    mutationFn: (d: Pick<PriceListEntry, 'price' | 'quantity' | 'order_time' | 'currency'>) =>
      componentsApi.addPrice(serialNumber, d),
    onSuccess: () => {
      invalidate()
      setCreateOpen(false)
      setCreateForm(EMPTY_FIELDS)
      setCreateError('')
    },
    onError: (e) => setCreateError(e instanceof Error ? e.message : 'Error'),
  })

  const updateMut = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: Pick<PriceListEntry, 'price' | 'quantity' | 'order_time' | 'currency'>
    }) => componentsApi.updatePrice(id, data),
    onSuccess: () => {
      invalidate()
      setEditTarget(null)
      setEditError('')
      setSelectedId(null)
    },
    onError: (e) => setEditError(e instanceof Error ? e.message : 'Error'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => componentsApi.deletePrice(id),
    onSuccess: () => {
      invalidate()
      setDeleteTarget(null)
      setSelectedId(null)
    },
  })

  const parseFields = (f: PriceFields) => {
    const qty = parseInt(f.quantity, 10)
    if (!f.price || !f.order_time || !Number.isFinite(qty) || qty < 1) {
      return null
    }
    return {
      price: f.price,
      quantity: qty,
      order_time: f.order_time,
      currency: f.currency,
    }
  }

  const openEdit = (entry: PriceListEntry) => {
    setEditTarget(entry)
    setEditForm(entryToFields(entry))
    setEditError('')
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Price History
        </p>
        <Button
          size="sm"
          variant="outline"
          className="h-6 text-xs gap-1"
          onClick={() => {
            setSelectedId(null)
            setCreateForm(EMPTY_FIELDS)
            setCreateError('')
            setCreateOpen(true)
          }}
        >
          <Plus className="h-3 w-3" />
          Add Entry
        </Button>
      </div>

      <Separator />

      {isLoading && (
        <p className="text-xs text-muted-foreground">Loading price history…</p>
      )}

      {!isLoading && entries.length === 0 && (
        <p className="text-xs text-muted-foreground">No price entries yet.</p>
      )}

      {entries.length > 0 && (
        <Table
          storageKey="foundry.table.price-history"
          defaultColumnWidths={PRICE_TABLE_WIDTHS}
        >
          <TableHeader>
            <TableRow className="text-[11px]">
              <TableHead columnId="order_time">Order Date</TableHead>
              <TableHead columnId="price">Price</TableHead>
              <TableHead columnId="quantity">Qty</TableHead>
              <TableHead columnId="total">Total</TableHead>
              <TableHead columnId="actions" className="sr-only">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((e) => {
              const selected = selectedId === e.id
              return (
                <TableRow
                  key={e.id}
                  className={cn('text-xs cursor-pointer')}
                  data-state={selected ? 'selected' : undefined}
                  onClick={() =>
                    setSelectedId((id) => (id === e.id ? null : e.id))
                  }
                >
                  <TableCell className="text-muted-foreground">
                    {fmtDate(e.order_time)}
                  </TableCell>
                  <TableCell className="font-mono font-medium">
                    {fmtMoney(e.price, e.currency ?? 'EUR')}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.quantity}
                  </TableCell>
                  <TableCell className="font-mono font-medium">
                    {fmtMoney(e.total, e.currency ?? 'EUR')}
                  </TableCell>
                  <TableCell className="p-1">
                    {selected && (
                      <div
                        className="flex items-center justify-end gap-0.5"
                        onClick={(ev) => ev.stopPropagation()}
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          title="Edit"
                          aria-label="Edit"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(e)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          title="Delete"
                          aria-label="Delete"
                          className="text-muted-foreground/80 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(e)}
                        >
                          <CircleMinus className="h-3.5 w-3.5" strokeWidth={2} />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      {/* Add entry */}
      <PopupModal
        open={createOpen}
        onOpenChange={(open) => {
          if (!open && !addMut.isPending) {
            setCreateOpen(false)
            setCreateError('')
          }
        }}
        title="Add price entry"
        description="Record a purchase price and quantity for this component."
        size="sm"
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            const data = parseFields(createForm)
            if (!data) {
              setCreateError('Please fill in a valid date, price, and quantity.')
              return
            }
            setCreateError('')
            addMut.mutate(data)
          }}
        >
          <PriceFieldsForm
            idPrefix="price-create"
            values={createForm}
            onChange={setCreateForm}
          />
          {createError && (
            <p className="text-xs text-destructive">{createError}</p>
          )}
          <DialogFooter className="mt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={addMut.isPending}
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={addMut.isPending}>
              {addMut.isPending ? 'Adding…' : 'Add Entry'}
            </Button>
          </DialogFooter>
        </form>
      </PopupModal>

      {/* Edit entry */}
      <PopupModal
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open && !updateMut.isPending) {
            setEditTarget(null)
            setEditError('')
          }
        }}
        title="Edit price entry"
        description="Update the order date, unit price, or quantity."
        size="sm"
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!editTarget) return
            const data = parseFields(editForm)
            if (!data) {
              setEditError('Please fill in a valid date, price, and quantity.')
              return
            }
            setEditError('')
            updateMut.mutate({ id: editTarget.id, data })
          }}
        >
          <PriceFieldsForm
            idPrefix="price-edit"
            values={editForm}
            onChange={setEditForm}
          />
          {editError && <p className="text-xs text-destructive">{editError}</p>}
          <DialogFooter className="mt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={updateMut.isPending}
              onClick={() => setEditTarget(null)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={updateMut.isPending}>
              {updateMut.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </PopupModal>

      {/* Delete confirm */}
      <PopupModal
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleteMut.isPending) setDeleteTarget(null)
        }}
        title="Delete price entry?"
        description={
          deleteTarget
            ? `This will permanently delete the ${fmtDate(deleteTarget.order_time)} entry (${fmtMoney(deleteTarget.price, deleteTarget.currency ?? 'EUR')} × ${deleteTarget.quantity}). This action cannot be undone.`
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
            onClick={() => {
              if (deleteTarget) deleteMut.mutate(deleteTarget.id)
            }}
          >
            {deleteMut.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </PopupModal>
    </div>
  )
}
