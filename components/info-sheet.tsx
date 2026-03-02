"use client"

import { useEffect, useRef } from "react"
import { X } from "lucide-react"

interface InfoSheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function InfoSheet({ open, onClose, title, children }: InfoSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative z-10 w-full max-w-md rounded-t-2xl bg-background px-5 pb-8 pt-3 shadow-lg animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Drag handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="text-sm leading-relaxed text-foreground">
          {children}
        </div>
      </div>
    </div>
  )
}
