import { useRef } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ClearableFilterSelect } from '@/components/components/ClearableFilterSelect'
import { PAGE_SIZE_OPTIONS } from '@/lib/pagination'
import { cn } from '@/lib/utils'

const TYPE_FILTER_ALL = '__all__'
const MANUFACTURER_FILTER_ALL = '__all__'

type ComponentsToolbarProps = {
  totalCount: number
  catalogCount: number
  hasActiveFilters: boolean
  pageSize: number
  onPageSizeChange: (size: number) => void
  manufacturerFilter: string | null
  onManufacturerFilterChange: (value: string | null) => void
  onClearManufacturerFilter: () => void
  availableManufacturers: string[]
  typeFilter: string | null
  onTypeFilterChange: (value: string | null) => void
  onClearTypeFilter: () => void
  availableTypes: string[]
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  searchFocused: boolean
  onSearchFocusedChange: (focused: boolean) => void
  onAddComponent: () => void
}

export function ComponentsToolbar({
  totalCount,
  catalogCount,
  hasActiveFilters,
  pageSize,
  onPageSizeChange,
  manufacturerFilter,
  onManufacturerFilterChange,
  onClearManufacturerFilter,
  availableManufacturers,
  typeFilter,
  onTypeFilterChange,
  onClearTypeFilter,
  availableTypes,
  searchQuery,
  onSearchQueryChange,
  searchFocused,
  onSearchFocusedChange,
  onAddComponent,
}: ComponentsToolbarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchExpanded = searchFocused || searchQuery.length > 0

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/80 px-4 py-3">
      <div className="min-w-0">
        <h1 className="text-base font-semibold">Components</h1>
        <p className="text-xs text-muted-foreground">
          {hasActiveFilters
            ? `${totalCount} of ${catalogCount} components`
            : `${catalogCount} components in catalog`}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Show</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger
              size="sm"
              className="h-7 w-[4.25rem] gap-1 border-input bg-transparent px-2 text-xs shadow-none dark:bg-input/30"
              aria-label="Rows per page"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ClearableFilterSelect
          label="Manufacturer"
          ariaLabel="Select component manufacturer"
          value={manufacturerFilter}
          allValue={MANUFACTURER_FILTER_ALL}
          options={availableManufacturers}
          onChange={onManufacturerFilterChange}
          onClear={onClearManufacturerFilter}
        />

        <ClearableFilterSelect
          label="Type"
          ariaLabel="Select component type"
          value={typeFilter}
          allValue={TYPE_FILTER_ALL}
          options={availableTypes}
          onChange={onTypeFilterChange}
          onClear={onClearTypeFilter}
        />

        <div
          className={cn(
            'relative flex h-7 items-center gap-1.5 overflow-hidden rounded-[min(var(--radius-md),12px)] border border-input bg-transparent px-2 transition-[width] duration-200 ease-out dark:bg-input/30',
            searchExpanded
              ? 'w-52'
              : 'w-[5.25rem] cursor-pointer hover:bg-muted/50 dark:hover:bg-input/50',
            searchQuery.trim() && 'border-foreground/40',
          )}
          onClick={() => {
            if (!searchExpanded) searchInputRef.current?.focus()
          }}
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {!searchExpanded && (
            <span className="text-xs text-muted-foreground select-none">Search</span>
          )}
          <Input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onFocus={() => onSearchFocusedChange(true)}
            onBlur={() => onSearchFocusedChange(false)}
            placeholder="Serial or name…"
            className={cn(
              'h-7 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent',
              searchExpanded ? 'min-w-0 flex-1' : 'sr-only',
            )}
            aria-label="Search components by serial number or name"
          />
          {searchExpanded && searchQuery && (
            <button
              type="button"
              className="shrink-0 rounded-sm p-0.5 text-muted-foreground opacity-70 hover:text-foreground hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation()
                onSearchQueryChange('')
                searchInputRef.current?.focus()
              }}
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <Button size="sm" className="h-7 gap-1 text-xs" onClick={onAddComponent}>
          <Plus className="h-3.5 w-3.5" />
          Add Component
        </Button>
      </div>
    </div>
  )
}
