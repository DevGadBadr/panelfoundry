import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PriceListPanel } from './PriceListPanel'
import type { Component } from '@/api/types'

interface Props {
  component: Component
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] text-xs gap-x-2 py-1">
      <span className="text-muted-foreground text-right">{label}</span>
      <span className="font-medium">{value ?? '—'}</span>
    </div>
  )
}

export function ComponentDetail({ component: c }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* Metadata */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Specifications
        </p>
        <Row label="Name" value={c.name} />
        <Row label="Type" value={<Badge variant="secondary" className="text-[10px]">{c.type}</Badge>} />
        <Row
          label="Width × Height"
          value={c.width_mm && c.height_mm ? `${c.width_mm} × ${c.height_mm} mm` : null}
        />
        <Row label="Max Temp" value={c.env_temp_c != null ? `${c.env_temp_c} °C` : null} />
        <Row
          label="Conformal Coat"
          value={
            c.env_coated ? (
              <Badge className="text-[10px] py-0 px-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
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

      {/* Price History — linked automatically to this component */}
      <PriceListPanel serialNumber={c.serial_number} />
    </div>
  )
}
