import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { PopupModal, type PopupModalSize } from '@/components/ui/popup-modal'
import { DialogFooter } from '@/components/ui/dialog'

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  size?: PopupModalSize
  pending?: boolean
  confirmLabel?: string
  pendingLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel?: () => void
  /** Destructive confirm button (default true). */
  destructive?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  size = 'sm',
  pending = false,
  confirmLabel = 'Delete',
  pendingLabel = 'Deleting…',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  destructive = true,
}: ConfirmDialogProps) {
  return (
    <PopupModal
      open={open}
      onOpenChange={(next) => {
        if (!next && pending) return
        onOpenChange(next)
      }}
      title={title}
      description={description}
      size={size}
    >
      <DialogFooter className="mt-2">
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => {
            onCancel?.()
            onOpenChange(false)
          }}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={destructive ? 'destructive' : 'default'}
          size="sm"
          disabled={pending}
          onClick={onConfirm}
        >
          {pending ? pendingLabel : confirmLabel}
        </Button>
      </DialogFooter>
    </PopupModal>
  )
}
