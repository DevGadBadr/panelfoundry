import { cn } from '@/lib/utils'

type FoundryLogoProps = {
  className?: string
}

/** Foundry app icon — white tile in light mode, black tile in dark mode. */
export function FoundryLogo({ className }: FoundryLogoProps) {
  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden
        className={cn('shrink-0 dark:hidden', className)}
      >
        <rect width="32" height="32" rx="8" fill="#ffffff" />
        <circle cx="16" cy="16" r="10" stroke="#000000" strokeWidth="1.5" opacity="0.72" />
        <g fill="#000000" opacity="0.82">
          <path d="M16 7.2 L17.15 12.1 A4.6 4.6 0 0 0 14.85 12.1 Z" />
          <path d="M23.9 20.8 L19.15 18.85 A4.6 4.6 0 0 0 20.25 16.85 Z" />
          <path d="M8.1 20.8 L11.75 16.85 A4.6 4.6 0 0 0 12.85 18.85 Z" />
        </g>
        <circle cx="16" cy="6.4" r="1.65" fill="#000000" />
        <circle cx="24.7" cy="21.6" r="1.65" fill="#000000" opacity="0.92" />
        <circle cx="7.3" cy="21.6" r="1.65" fill="#000000" opacity="0.92" />
        <circle cx="16" cy="16" r="4.2" fill="#000000" />
        <circle cx="14.65" cy="14.55" r="1.25" fill="#ffffff" opacity="0.38" />
      </svg>

      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden
        className={cn('hidden shrink-0 dark:block', className)}
      >
        <rect width="32" height="32" rx="8" fill="#000000" />
        <circle cx="16" cy="16" r="10" stroke="#ffffff" strokeWidth="1.5" opacity="0.78" />
        <g fill="#ffffff" opacity="0.88">
          <path d="M16 7.2 L17.15 12.1 A4.6 4.6 0 0 0 14.85 12.1 Z" />
          <path d="M23.9 20.8 L19.15 18.85 A4.6 4.6 0 0 0 20.25 16.85 Z" />
          <path d="M8.1 20.8 L11.75 16.85 A4.6 4.6 0 0 0 12.85 18.85 Z" />
        </g>
        <circle cx="16" cy="6.4" r="1.65" fill="#ffffff" />
        <circle cx="24.7" cy="21.6" r="1.65" fill="#ffffff" opacity="0.94" />
        <circle cx="7.3" cy="21.6" r="1.65" fill="#ffffff" opacity="0.94" />
        <circle cx="16" cy="16" r="4.2" fill="#ffffff" />
        <circle cx="14.65" cy="14.55" r="1.25" fill="#000000" opacity="0.32" />
      </svg>
    </>
  )
}
