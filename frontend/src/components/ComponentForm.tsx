import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Component } from '@/api/types'

interface Props {
  initial?: Partial<Component>
  isEdit?: boolean
  onSubmit: (data: Partial<Component>) => Promise<unknown>
  onCancel: () => void
  /** Called whenever form fields change — used to persist drafts. */
  onChange?: (data: Partial<Component>) => void
}

const EMPTY: Partial<Component> = {
  serial_number: '',
  name: '',
  description: '',
  type: '',
  width_mm: null,
  height_mm: null,
  env_temp_c: null,
  env_coated: false,
}

export function ComponentForm({
  initial = EMPTY,
  isEdit = false,
  onSubmit,
  onCancel,
  onChange,
}: Props) {
  const [form, setForm] = useState<Partial<Component>>({ ...EMPTY, ...initial })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Persist draft on every change (skip the initial mount snapshot).
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])
  useEffect(() => {
    if (!hydrated) return
    onChange?.(form)
  }, [form, hydrated, onChange])

  const set = (key: keyof Component, value: string | number | boolean | null) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { pricelist_id: _ignored, ...payload } = form
      await onSubmit(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving component')
    } finally {
      setLoading(false)
    }
  }

  const field = (
    id: string,
    label: string,
    el: React.ReactNode,
  ) => (
    <div className="grid grid-cols-[140px_1fr] items-center gap-x-3 gap-y-1">
      <Label htmlFor={id} className="text-right text-xs text-muted-foreground">
        {label}
      </Label>
      {el}
    </div>
  )

  return (
    <form onSubmit={handle} className="flex flex-col gap-3 py-2">
      {field(
        'sn',
        'Serial Number',
        <Input
          id="sn"
          value={form.serial_number ?? ''}
          onChange={(e) => set('serial_number', e.target.value)}
          disabled={isEdit}
          className="h-7 text-xs"
          required
          placeholder="e.g. CPU-6ES7-315"
        />,
      )}
      {field(
        'name',
        'Name',
        <Input
          id="name"
          value={form.name ?? ''}
          onChange={(e) => set('name', e.target.value)}
          className="h-7 text-xs"
          required
          placeholder="Component display name"
        />,
      )}
      {field(
        'type',
        'Type',
        <Input
          id="type"
          value={form.type ?? ''}
          onChange={(e) => set('type', e.target.value)}
          className="h-7 text-xs"
          required
          placeholder="e.g. CPU, IO, PSU"
        />,
      )}
      {field(
        'width',
        'Width (mm)',
        <Input
          id="width"
          type="number"
          step="0.01"
          value={form.width_mm ?? ''}
          onChange={(e) => set('width_mm', e.target.value || null)}
          className="h-7 text-xs"
          placeholder="optional"
        />,
      )}
      {field(
        'height',
        'Height (mm)',
        <Input
          id="height"
          type="number"
          step="0.01"
          value={form.height_mm ?? ''}
          onChange={(e) => set('height_mm', e.target.value || null)}
          className="h-7 text-xs"
          placeholder="optional"
        />,
      )}
      {field(
        'env_temp',
        'Max Temp (°C)',
        <Input
          id="env_temp"
          type="number"
          value={form.env_temp_c ?? ''}
          onChange={(e) => set('env_temp_c', e.target.value ? parseInt(e.target.value, 10) : null)}
          className="h-7 text-xs"
          placeholder="optional"
        />,
      )}
      {field(
        'env_coated',
        'Conformal Coat',
        <label
          htmlFor="env_coated"
          className={`inline-flex h-7 cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 select-none transition-colors ${
            form.env_coated
              ? 'border-primary/40 bg-primary/5 dark:bg-primary/10'
              : 'border-input bg-transparent hover:bg-muted/50'
          }`}
        >
          <Checkbox
            id="env_coated"
            checked={form.env_coated ?? false}
            onCheckedChange={(checked) => set('env_coated', checked)}
          />
          <span
            className={`text-xs ${
              form.env_coated ? 'font-medium text-foreground' : 'text-muted-foreground'
            }`}
          >
            {form.env_coated ? 'Coated' : 'Not coated'}
          </span>
        </label>,
      )}
      {field(
        'description',
        'Description',
        <Textarea
          id="description"
          value={form.description ?? ''}
          onChange={(e) => set('description', e.target.value)}
          className="text-xs min-h-[60px] resize-none"
          placeholder="optional"
        />,
      )}

      {error && <p className="text-xs text-destructive px-1">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Component'}
        </Button>
      </div>
    </form>
  )
}
