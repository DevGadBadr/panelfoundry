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
        <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
          {/* Top nav */}
          <header className="flex shrink-0 items-center gap-3 border-b border-border/80 bg-background px-4 py-2">
            <span className="text-sm font-bold tracking-tight">Foundry</span>
            <span className="text-xs text-muted-foreground">PLC Component Catalog</span>
            <div className="ml-auto">
              <ThemeSwitcher />
            </div>
          </header>

          {/* Main layout */}
          <main className="mx-auto flex min-h-0 w-full max-w-[1280px] flex-1 flex-col overflow-hidden">
            <ComponentsPage />
          </main>
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
