import { Construction, CircuitBoard, Layers } from 'lucide-react'

export function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-12 text-center">
      <div className="relative">
        <div
          className="absolute inset-0 rounded-full bg-muted/60 blur-2xl"
          aria-hidden
        />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
          <Construction
            className="h-9 w-9 text-foreground/80"
            strokeWidth={1.5}
            aria-hidden
          />
        </div>
      </div>

      <div className="max-w-md space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">
          Foundry PLC Panel Builder
        </h1>
        <p className="text-sm text-muted-foreground">
          Under construction. The panel canvas and layout tools are on the way.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6 text-muted-foreground">
        <div className="flex items-center gap-2 text-xs">
          <CircuitBoard className="h-4 w-4" aria-hidden />
          <span>PLC panels</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Layers className="h-4 w-4" aria-hidden />
          <span>Layout tools</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Construction className="h-4 w-4" aria-hidden />
          <span>Coming soon</span>
        </div>
      </div>
    </div>
  )
}
