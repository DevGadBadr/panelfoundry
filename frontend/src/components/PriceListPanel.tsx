import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
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
import { componentsApi } from '@/api/components'
import type { PriceListEntry } from '@/api/types'

interface Props {
  serialNumber: string
}

type PriceForm = {
  price: string
  quantity: number
  order_time: string
}

const EMPTY_PRICE: PriceForm = { price: '', quantity: 1, order_time: '' }

const PRICE_TABLE_WIDTHS = {
  order_time: 160,
  price: 88,
  quantity: 56,
} as const

export function PriceListPanel({ serialNumber }: Props) {
  const qc = useQueryClient()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<PriceForm>(EMPTY_PRICE)
  const [formError, setFormError] = useState('')

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['prices', serialNumber],
    queryFn: () => componentsApi.listPrices(serialNumber),
  })

  const addMut = useMutation({
    mutationFn: (d: Pick<PriceListEntry, 'price' | 'quantity' | 'order_time'>) =>
      componentsApi.addPrice(serialNumber, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prices', serialNumber] })
      setAdding(false)
      setForm(EMPTY_PRICE)
    },
    onError: (e) => setFormError(e instanceof Error ? e.message : 'Error'),
  })

  const set = <K extends keyof PriceForm>(key: K, value: PriceForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    addMut.mutate({
      price: form.price,
      quantity: Number(form.quantity),
      order_time: form.order_time,
    })
  }

  const fmt = (iso: string) => {
    try { return new Date(iso).toLocaleString() } catch { return iso }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Price History
        </p>
        {!adding && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-xs gap-1"
            onClick={() => setAdding(true)}
          >
            <Plus className="h-3 w-3" />
            Add Entry
          </Button>
        )}
      </div>

      {adding && (
        <form
          onSubmit={handleAdd}
          className="border rounded-md p-3 flex flex-col gap-2 bg-muted/30"
        >
          <p className="text-xs font-medium">New Price Entry</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] text-muted-foreground">Price</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                required
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                className="h-7 text-xs"
                placeholder="0.00"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] text-muted-foreground">Quantity</Label>
              <Input
                type="number"
                min="1"
                required
                value={form.quantity}
                onChange={(e) => set('quantity', parseInt(e.target.value, 10))}
                className="h-7 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <Label className="text-[10px] text-muted-foreground">Order Date</Label>
              <Input
                type="datetime-local"
                required
                value={form.order_time}
                onChange={(e) => set('order_time', e.target.value)}
                className="h-7 text-xs"
              />
            </div>
          </div>
          {formError && <p className="text-xs text-destructive">{formError}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => { setAdding(false); setFormError('') }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-6 text-xs"
              disabled={addMut.isPending}
            >
              {addMut.isPending ? 'Adding…' : 'Add'}
            </Button>
          </div>
        </form>
      )}

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((e) => (
              <TableRow key={e.id} className="text-xs">
                <TableCell className="text-muted-foreground">{fmt(e.order_time)}</TableCell>
                <TableCell className="font-mono font-medium">
                  {parseFloat(e.price).toFixed(2)}
                </TableCell>
                <TableCell className="text-muted-foreground">{e.quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
