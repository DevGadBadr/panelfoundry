import { Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SerialNumberLabel } from '@/components/SerialNumberLabel'
import { PriceListPanel } from './PriceListPanel'
import type { Component } from '@/api/types'

interface Props {
  component: Component
  onDelete: () => void
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] text-xs gap-x-2 py-1">
      <span className="text-muted-foreground text-right">{label}</span>
      <span className="font-medium">{value ?? '—'}</span>
    </div>
  )
}

export function ComponentDetail({ component: c, onDelete }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Specifications
        </p>
        <Row
          label="Serial Number"
          value={
            <SerialNumberLabel
              serial={c.serial_number}
              isGenerated={c.serial_is_generated}
            />
          }
        />
        <Row label="Name" value={c.name} />
        <Row label="Manufacturer" value={c.manufacturer || null} />
        <Row label="Type" value={<Badge variant="secondary" className="text-[10px]">{c.type}</Badge>} />
        <Row
          label="Width × Height"
          value={c.width_mm && c.height_mm ? `${c.width_mm} × ${c.height_mm} mm` : null}
        />
        <Row
          label="Consumed DC Current"
          value={c.consumed_dc_current_ma != null ? `${c.consumed_dc_current_ma} mA` : null}
        />
        <Row label="Max Temp" value={c.env_temp_c != null ? `${c.env_temp_c} °C` : null} />
        <Row
          label="Conformal Coat"
          value={
            c.env_coated ? (
              <Badge variant="success" className="text-[10px] py-0 px-1.5">
                Yes
              </Badge>
            ) : (
              'No'
            )
          }
        />
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
