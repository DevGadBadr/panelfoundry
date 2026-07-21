"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type PopupModalSize = "sm" | "md" | "lg"

const sizeClasses: Record<PopupModalSize, string> = {
  sm: "sm:max-w-[480px]",
  md: "sm:max-w-[640px]",
  lg: "sm:max-w-[800px]",
}

export function PopupModal({
  open,
  onOpenChange,
  title,
  description,
  size = "sm",
  className,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  size?: PopupModalSize
  className?: string
  children: React.ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          sizeClasses[size],
          // Keep content readable on smaller screens.
          "max-h-[calc(100vh-2rem)] overflow-y-auto",
          className
        )}
      >
        <DialogHeader className="gap-1">
          <DialogTitle className="text-sm">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="text-xs">{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

