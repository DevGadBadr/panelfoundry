import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ComponentsPage } from './pages/ComponentsPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        {/* Top nav */}
        <header className="border-b px-4 py-2 flex items-center gap-3">
          <span className="text-sm font-bold tracking-tight">Foundry</span>
          <span className="text-xs text-muted-foreground">PLC Component Catalog</span>
        </header>

        {/* Main layout */}
        <main className="max-w-[1280px] mx-auto">
          <ComponentsPage />
        </main>
      </div>
    </QueryClientProvider>
  )
}
