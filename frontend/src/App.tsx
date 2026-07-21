import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ComponentsPage } from './pages/ComponentsPage'
import { ThemeProvider } from './lib/theme'
import { ThemeSwitcher } from './components/ThemeSwitcher'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <div className="min-h-screen bg-background text-foreground">
          {/* Top nav */}
          <header className="border-b px-4 py-2 flex items-center gap-3">
            <span className="text-sm font-bold tracking-tight">Foundry</span>
            <span className="text-xs text-muted-foreground">PLC Component Catalog</span>
            <div className="ml-auto">
              <ThemeSwitcher />
            </div>
          </header>

          {/* Main layout */}
          <main className="max-w-[1280px] mx-auto">
            <ComponentsPage />
          </main>
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
