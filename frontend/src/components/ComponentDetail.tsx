import { Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SerialNumberLabel } from '@/components/SerialNumberLabel'
import { LabeledRow } from '@/components/LabeledRow'
import { PriceListPanel } from './PriceListPanel'
import type { Component } from '@/api/types'
import { formatMm, normalizeManufacturer } from '@/lib/utils'

interface Props {
  component: Component
  onDelete: () => void
}

export function ComponentDetail({ component: c, onDelete }: Props) {
  const width = formatMm(c.width_mm)
  const height = formatMm(c.height_mm)
  const depth = formatMm(c.depth_mm)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Specifications
        </p>
        <LabeledRow label="Serial Number">
          <SerialNumberLabel
            serial={c.serial_number}
            isGenerated={c.serial_is_generated}
          />
        </LabeledRow>
        <LabeledRow label="Name">{c.name}</LabeledRow>
        <LabeledRow label="Manufacturer">
          {normalizeManufacturer(c.manufacturer) || null}
        </LabeledRow>
        <LabeledRow label="Type">
          <Badge variant="secondary" className="text-[10px]">{c.type}</Badge>
        </LabeledRow>
        <LabeledRow label="Part Number">{c.part_number || null}</LabeledRow>
        <LabeledRow label="Width">{width != null ? `${width} mm` : null}</LabeledRow>
        <LabeledRow label="Height">{height != null ? `${height} mm` : null}</LabeledRow>
        <LabeledRow label="Depth">{depth != null ? `${depth} mm` : null}</LabeledRow>
        <LabeledRow label="Consumed DC Current">
          {c.consumed_dc_current_ma != null ? `${c.consumed_dc_current_ma} mA` : null}
        </LabeledRow>
        <LabeledRow label="Max Temp">
          {c.env_temp_c != null ? `${c.env_temp_c} °C` : null}
        </LabeledRow>
        <LabeledRow label="Conformal Coat">
          {c.env_coated ? (
            <Badge variant="success" className="text-[10px] py-0 px-1.5">
              Yes
            </Badge>
          ) : (
            'No'
          )}
        </LabeledRow>
        {c.description && (
          <div className="mt-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
              Description
            </p>
            <p className="text-xs leading-relaxed">{c.description}</p>
          </div>
        )}
      </div>

      <Separator />

      <PriceListPanel serialNumber={c.serial_number} />

      <div className="mt-2 border-t pt-4">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
          Delete component
        </Button>
      </div>
    </div>
  )
}
