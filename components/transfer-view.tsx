"use client"

import { useState } from "react"
import { ArrowLeft, X, ChevronDown, ChevronUp, Info } from "lucide-react"
import { type CurrencyView } from "@/components/currency-toggle"
import { AccountSection, type RowData } from "@/components/account-section"
import { InfoSheet } from "@/components/info-sheet"

type FromAccountType = "tfsa" | "margin"

const fromAccounts: Record<FromAccountType, { label: string; number: string; subtitle: string }> = {
  tfsa: { label: "TFSA", number: "123345678", subtitle: "Self-directed Individual" },
  margin: { label: "MARGIN", number: "123123123", subtitle: "Self-directed Individual" },
}

interface Thresholds {
  cad: number
  usd: number
  combinedCad: number
  combinedUsd: number
}

const availableToTransferData: Record<FromAccountType, Thresholds> = {
  tfsa: { cad: 300, usd: 300, combinedCad: 600, combinedUsd: 550 },
  margin: { cad: 500, usd: 500, combinedCad: 1000, combinedUsd: 920 },
}

const availableToTransferTodayData: Record<FromAccountType, Thresholds> = {
  tfsa: { cad: 280, usd: 280, combinedCad: 560, combinedUsd: 510 },
  margin: { cad: 250, usd: 250, combinedCad: 500, combinedUsd: 460 },
}

function isCombinedView(view: CurrencyView) {
  return view === "combined-cad" || view === "combined-usd"
}

function getThresholdValue(thresholds: Thresholds, view: CurrencyView): number {
  switch (view) {
    case "combined-cad": return thresholds.combinedCad
    case "combined-usd": return thresholds.combinedUsd
    case "cad": return thresholds.cad
    case "usd": return thresholds.usd
  }
}

function fmt(value: number): string {
  return `$${value.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function TransferView() {
  const [currencyView, setCurrencyView] = useState<CurrencyView>("combined-cad")
  const [fromOpen, setFromOpen] = useState(true)
  const [toOpen, setToOpen] = useState(true)
  const [fromAccount, setFromAccount] = useState<FromAccountType>("tfsa")
  const [fromDropdownOpen, setFromDropdownOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetContent, setSheetContent] = useState<{ title: string; body: string }>({
    title: "",
    body: "",
  })
  const [inputAmount, setInputAmount] = useState("")

  const combined = isCombinedView(currencyView)

  function openSheet(title: string, body: string) {
    setSheetContent({ title, body })
    setSheetOpen(true)
  }

  function getFromRows(): RowData[] {
    const t = availableToTransferData[fromAccount]
    return [
      {
        label: "Available to transfer",
        usd: fmt(t.usd),
        cad: fmt(t.cad),
        combinedCad: fmt(t.combinedCad),
        combinedUsd: fmt(t.combinedUsd),
        hasTooltip: true,
        tooltipKey: "available-transfer",
      },
    ]
  }

  function getToRows(): RowData[] {
    if (combined) {
      return [
        {
          label: "Buying power",
          usd: "$100.00",
          cad: "$100.00",
          combinedCad: "$200.00",
          combinedUsd: "$180.00",
        },
      ]
    }
    return [
      {
        label: "Cash",
        usd: "$100.00",
        cad: "$100.00",
        combinedCad: "$200.00",
        combinedUsd: "$180.00",
      },
    ]
  }

  function getEtaMessage(): string | null {
    const amount = parseFloat(inputAmount)
    if (isNaN(amount) || amount <= 0) return null

    const todayLimit = getThresholdValue(availableToTransferTodayData[fromAccount], currencyView)
    const maxLimit = getThresholdValue(availableToTransferData[fromAccount], currencyView)

    if (amount <= todayLimit) {
      return "This request will take between 1-2 business days."
    }
    if (amount > todayLimit && amount <= maxLimit) {
      return "This request will take between 2-3 business days."
    }
    return null
  }

  function handleTooltipClick(key?: string) {
    switch (key) {
      case "available-transfer":
        openSheet(
          "Available to transfer",
          "This is the total amount available for transfer from this account. Transfers within the settled cash amount typically process faster."
        )
        break
      default:
        break
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9.]/g, "")
    const parts = raw.split(".")
    if (parts.length > 2) return
    if (parts[1] && parts[1].length > 2) return
    setInputAmount(raw)
  }

  const fromInfo = fromAccounts[fromAccount]
  const fromRows = getFromRows()
  const toRows = getToRows()
  const etaMessage = getEtaMessage()

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      {/* Status bar mock */}
      <div className="flex items-center justify-between px-5 pt-2 pb-1 text-xs font-medium text-foreground">
        <span>12:30</span>
        <div className="flex items-center gap-1">
          <span>{"..."}</span>
          <span>50%</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button type="button" className="p-1" aria-label="Go back">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-base font-semibold text-foreground">Transfer funds</h1>
        <button type="button" className="p-1" aria-label="Close">
          <X className="h-5 w-5 text-foreground" />
        </button>
      </div>

      {/* Amount input */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center rounded-md border border-border px-3 py-2">
            <span className="text-sm text-muted-foreground">$</span>
            <input
              type="text"
              inputMode="decimal"
              className="ml-1 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              placeholder="0.00"
              value={inputAmount}
              onChange={handleInputChange}
            />
          </div>
          <button
            type="button"
            className="flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground"
          >
            CAD
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        {etaMessage && (
          <p className="mt-2 text-xs font-medium text-amber-600">{etaMessage}</p>
        )}
      </div>

      {/* Currency conversion link */}
      <div className="flex items-center gap-1 px-4 py-2">
        <span className="text-xs text-muted-foreground">Learn how currency is converted</span>
        <Info className="h-3 w-3 text-muted-foreground" />
      </div>

      {/* Account balances heading */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-sm font-semibold text-foreground">Account balances</h2>
      </div>

      {/* From Account */}
      <div className="mx-4 rounded-xl border border-border bg-background">
        <button
          type="button"
          onClick={() => setFromOpen(!fromOpen)}
          className="flex w-full items-center justify-between px-4 py-3"
        >
          <span className="text-sm font-medium text-foreground">From account</span>
          {fromOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {fromOpen && (
          <div className="border-t border-border">
            {/* Account selector */}
            <div className="relative px-4 pt-3 pb-2">
              <button
                type="button"
                onClick={() => setFromDropdownOpen(!fromDropdownOpen)}
                className="flex items-center gap-1.5"
              >
                <p className="text-sm font-semibold text-foreground">
                  {fromInfo.label} - {fromInfo.number}
                </p>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <p className="text-xs text-muted-foreground">{fromInfo.subtitle}</p>

              {fromDropdownOpen && (
                <div className="absolute left-4 top-full z-20 mt-1 w-56 rounded-lg border border-border bg-background py-1 shadow-lg">
                  {(Object.entries(fromAccounts) as [FromAccountType, typeof fromInfo][]).map(
                    ([key, acc]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setFromAccount(key)
                          setFromDropdownOpen(false)
                        }}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors"
                      >
                        <span className="text-foreground">
                          {acc.label} - {acc.number}
                        </span>
                        {fromAccount === key && (
                          <svg
                            className="h-4 w-4 text-[#1a8d1a] shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            <AccountSection
              currencyView={currencyView}
              onCurrencyChange={setCurrencyView}
              onTooltipClick={handleTooltipClick}
              rows={fromRows}
            />
          </div>
        )}
      </div>

      {/* To Account */}
      <div className="mx-4 mt-3 rounded-xl border border-border bg-background">
        <button
          type="button"
          onClick={() => setToOpen(!toOpen)}
          className="flex w-full items-center justify-between px-4 py-3"
        >
          <span className="text-sm font-medium text-foreground">To account</span>
          {toOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {toOpen && (
          <div className="border-t border-border">
            <div className="px-4 pt-3 pb-2">
              <p className="text-sm font-semibold text-foreground">RRSP - 123345678</p>
              <p className="text-xs text-muted-foreground">Self-directed Individual</p>
            </div>

            <AccountSection
              currencyView={currencyView}
              onCurrencyChange={setCurrencyView}
              rows={toRows}
            />
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Next button */}
      <div className="px-4 py-4">
        <button
          type="button"
          className="w-full rounded-full bg-[#1a8d1a] py-3.5 text-center text-sm font-semibold text-[#ffffff]"
        >
          Next
        </button>
      </div>

      {/* Info Bottom Sheet */}
      <InfoSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={sheetContent.title}
      >
        <p>{sheetContent.body}</p>
      </InfoSheet>
    </div>
  )
}
