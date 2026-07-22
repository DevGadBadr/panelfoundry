import { NavLink, Outlet } from 'react-router-dom'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { appTabs } from '@/nav'
import { cn } from '@/lib/utils'

export function AppLayout() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <header className="flex shrink-0 items-center gap-4 border-b border-border/80 bg-background px-4 py-2">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold tracking-tight">Foundry</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            PLC Panel Builder
          </span>
        </div>

        <nav className="flex items-center gap-0.5" aria-label="Main">
          {appTabs.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto">
          <ThemeSwitcher />
        </div>
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-[1280px] flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
