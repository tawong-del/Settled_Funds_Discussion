"use client"

import { Info } from "lucide-react"
import { CurrencyToggle, type CurrencyView } from "@/components/currency-toggle"

export interface RowData {
  label: string
  usd: string
  cad: string
  combinedCad: string
  combinedUsd: string
  hasTooltip?: boolean
  tooltipKey?: string
}

interface AccountSectionProps {
  currencyView: CurrencyView
  onCurrencyChange: (value: CurrencyView) => void
  rows: RowData[]
  onTooltipClick?: (tooltipKey?: string) => void
}

export function AccountSection({
  currencyView,
  onCurrencyChange,
  rows,
  onTooltipClick,
}: AccountSectionProps) {
  function getValues(row: RowData): string[] {
    switch (currencyView) {
      case "combined-cad":
        return [row.combinedCad]
      case "combined-usd":
        return [row.combinedUsd]
      case "usd":
        return [row.usd]
      case "cad":
        return [row.cad]
    }
  }

  function getColumnHeaders(): string[] {
    switch (currencyView) {
      case "combined-cad":
        return ["CAD"]
      case "combined-usd":
        return ["USD"]
      case "cad":
        return ["CAD"]
      case "usd":
        return ["USD"]
    }
  }

  const headers = getColumnHeaders()

  return (
    <div className="px-4 pb-4">
      {/* Toggle row */}
      <div className="flex items-center py-2">
        <CurrencyToggle value={currencyView} onChange={onCurrencyChange} />
      </div>

      {/* Column headers */}
      <div className="flex items-center py-1.5">
        <div className="flex-1" />
        {headers.map((h) => (
          <div key={h} className="w-24 text-right text-xs font-medium text-muted-foreground">
            {h}
          </div>
        ))}
      </div>

      {/* Data rows */}
      {rows.map((row) => {
        const values = getValues(row)
        return (
          <div key={row.label} className="flex items-center py-1.5">
            <div className="flex flex-1 items-center gap-1 min-w-0">
              <span className="text-sm text-foreground truncate">{row.label}</span>
              {row.hasTooltip && (
                <button
                  type="button"
                  onClick={() => onTooltipClick?.(row.tooltipKey)}
                  className="inline-flex shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`More info about ${row.label}`}
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {values.map((v, i) => (
              <div
                key={i}
                className="w-24 shrink-0 text-right text-sm font-medium tabular-nums text-foreground"
              >
                {v}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
