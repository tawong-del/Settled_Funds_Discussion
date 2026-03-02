"use client"

import { Check, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type CurrencyView = "combined-cad" | "combined-usd" | "cad" | "usd"

const options: { value: CurrencyView; label: string }[] = [
  { value: "combined-cad", label: "Combined in CAD" },
  { value: "combined-usd", label: "Combined in USD" },
  { value: "cad", label: "CAD" },
  { value: "usd", label: "USD" },
]

interface CurrencyToggleProps {
  value: CurrencyView
  onChange: (value: CurrencyView) => void
}

export function CurrencyToggle({ value, onChange }: CurrencyToggleProps) {
  const selectedLabel = options.find((o) => o.value === value)?.label ?? ""

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
        >
          {selectedLabel}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className="flex items-center justify-between text-sm cursor-pointer"
          >
            <span>{option.label}</span>
            {value === option.value && (
              <Check className="h-4 w-4 text-[#1a8d1a]" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
