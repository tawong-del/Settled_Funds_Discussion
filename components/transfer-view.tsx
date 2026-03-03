"use client"

import { useState } from "react"
import { ArrowLeft, X, ChevronDown, ChevronUp, Info } from "lucide-react"
import { type CurrencyView } from "@/components/currency-toggle"
import { AccountSection, type RowData } from "@/components/account-section"

type FromAccountType = "tfsa" | "margin" | "cash"
type Screen = "input" | "confirm" | "success"

const fromAccounts: Record<FromAccountType, { label: string; number: string; subtitle: string }> = {
  tfsa: { label: "TFSA", number: "123345678", subtitle: "Self-directed Individual" },
  margin: { label: "MARGIN", number: "123123123", subtitle: "Self-directed Individual" },
  cash: { label: "CASH", number: "123456789", subtitle: "Self-directed Individual" },
}

const toAccount = { label: "RRSP", number: "123345678", subtitle: "Self-directed Individual" }

interface Thresholds {
  cad: number
  usd: number
  combinedCad: number
  combinedUsd: number
}

const tfsaTransfer: Thresholds = { cad: 300, usd: 300, combinedCad: 600, combinedUsd: 550 }
const tfsaTransferToday: Thresholds = { cad: 280, usd: 280, combinedCad: 560, combinedUsd: 510 }

const cashTransfer: Thresholds = { cad: 300, usd: 300, combinedCad: 600, combinedUsd: 550 }
const cashTransferToday: Thresholds = { cad: 290, usd: 290, combinedCad: 580, combinedUsd: 530 }

const marginTransfer: Thresholds = { cad: 500, usd: 500, combinedCad: 1000, combinedUsd: 920 }
const marginTransferToday: Thresholds = { cad: 375, usd: 375, combinedCad: 750, combinedUsd: 690 }
const marginWithoutInterest: Thresholds = { cad: 175, usd: 175, combinedCad: 350, combinedUsd: 320 }

function val(t: Thresholds, v: CurrencyView): number {
  switch (v) {
    case "combined-cad": return t.combinedCad
    case "combined-usd": return t.combinedUsd
    case "cad": return t.cad
    case "usd": return t.usd
  }
}

function fmt(value: number): string {
  return `$${value.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function ccyLabel(v: CurrencyView): string {
  return v === "usd" || v === "combined-usd" ? "USD" : "CAD"
}

type MarginScenario = "same-day" | "interest-only" | "choose" | "rejected"

export function TransferView() {
  const [screen, setScreen] = useState<Screen>("input")
  const [fromCurrencyView, setFromCurrencyView] = useState<CurrencyView>("combined-cad")
  const [toCurrencyView, setToCurrencyView] = useState<CurrencyView>("combined-cad")
  const [fromOpen, setFromOpen] = useState(true)
  const [toOpen, setToOpen] = useState(true)
  const [fromAccount, setFromAccount] = useState<FromAccountType>("tfsa")
  const [fromDropdownOpen, setFromDropdownOpen] = useState(false)
  const [inputAmount, setInputAmount] = useState("")

  const [showDialog, setShowDialog] = useState(false)
  const [dialogScenario, setDialogScenario] = useState<"interest-only" | "choose" | null>(null)
  const [settlementChoice, setSettlementChoice] = useState<"instant" | "settlement" | null>(null)

  const amount = parseFloat(inputAmount)
  const ccy = ccyLabel(fromCurrencyView)
  const fromInfo = fromAccounts[fromAccount]

  // ── Helpers ──

  function getTransferThreshold(): Thresholds {
    if (fromAccount === "margin") return marginTransfer
    if (fromAccount === "cash") return cashTransfer
    return tfsaTransfer
  }

  function getTodayThreshold(): Thresholds {
    if (fromAccount === "margin") return marginTransferToday
    if (fromAccount === "cash") return cashTransferToday
    return tfsaTransferToday
  }

  function getFromRows(): RowData[] {
    const t = getTransferThreshold()
    return [{
      label: "Available to transfer",
      usd: fmt(t.usd), cad: fmt(t.cad),
      combinedCad: fmt(t.combinedCad), combinedUsd: fmt(t.combinedUsd),
    }]
  }

  function getToRows(): RowData[] {
    return [{
      label: "Buying power",
      usd: "$100.00", cad: "$100.00",
      combinedCad: "$200.00", combinedUsd: "$180.00",
    }]
  }

  function getMarginScenario(): MarginScenario | null {
    if (isNaN(amount) || amount <= 0) return null
    const noInterest = val(marginWithoutInterest, fromCurrencyView)
    const today = val(marginTransferToday, fromCurrencyView)
    const max = val(marginTransfer, fromCurrencyView)
    if (amount <= noInterest) return "same-day"
    if (amount <= today) return "interest-only"
    if (amount <= max) return "choose"
    return "rejected"
  }

  function getEtaMessage(): { text: string; color: string } | null {
    if (isNaN(amount) || amount <= 0) return null
    if (fromAccount === "margin") {
      const s = getMarginScenario()
      switch (s) {
        case "same-day": return { text: "This request will be processed same day.", color: "text-green-600" }
        case "interest-only": return { text: "Interest charges may apply on unsettled funds.", color: "text-amber-600" }
        case "choose": return { text: "This request will take between 2-3 business days.", color: "text-amber-600" }
        case "rejected": return { text: `Amount exceeds available to transfer of ${fmt(val(marginTransfer, fromCurrencyView))}.`, color: "text-red-600" }
        default: return null
      }
    }
    const todayLimit = val(getTodayThreshold(), fromCurrencyView)
    const maxLimit = val(getTransferThreshold(), fromCurrencyView)
    if (amount <= todayLimit) {
      if (fromAccount === "cash") return { text: "This request will be processed same day.", color: "text-green-600" }
      return { text: "This request will take between 1-2 business days.", color: "text-amber-600" }
    }
    if (amount <= maxLimit) return { text: "This request will take between 2-3 business days.", color: "text-amber-600" }
    return { text: `Amount exceeds available to transfer of ${fmt(maxLimit)}.`, color: "text-red-600" }
  }

  function getConfirmEta(): string {
    if (fromAccount === "margin") {
      const s = getMarginScenario()
      if (s === "same-day") return "Same day"
      if (s === "interest-only") return "Same day"
      if (s === "choose" && settlementChoice === "instant") return "Same day"
      if (s === "choose" && settlementChoice === "settlement") return "2-3 business days"
      return "2-3 business days"
    }
    const todayLimit = val(getTodayThreshold(), fromCurrencyView)
    if (amount <= todayLimit) {
      if (fromAccount === "cash") return "Same day"
      return "1-2 business days"
    }
    return "2-3 business days"
  }

  function getMarginChoiceBanner(): { text: string; borderColor: string; bgColor: string; textColor: string } | null {
    if (fromAccount !== "margin") return null
    const s = getMarginScenario()
    if (s === "interest-only" || (s === "choose" && settlementChoice === "instant")) {
      return {
        text: "You chose to transfer instantly. Interest charges will be applied on the unsettled funds portion of this transfer.",
        borderColor: "border-amber-200",
        bgColor: "bg-amber-50",
        textColor: "text-amber-800",
      }
    }
    if (s === "choose" && settlementChoice === "settlement") {
      return {
        text: "You chose to transfer on settlement day. Your request will be processed once funds have settled, estimated 2-3 business days.",
        borderColor: "border-green-200",
        bgColor: "bg-green-50",
        textColor: "text-green-800",
      }
    }
    return null
  }

  // ── Navigation ──

  function handleNext() {
    if (isNaN(amount) || amount <= 0) return
    if (fromAccount === "margin") {
      const s = getMarginScenario()
      if (s === "rejected") return
      if (s === "interest-only" || s === "choose") {
        setDialogScenario(s)
        setSettlementChoice(null)
        setShowDialog(true)
        return
      }
    } else {
      if (amount > val(getTransferThreshold(), fromCurrencyView)) return
    }
    setScreen("confirm")
  }

  function handleDialogProceed() {
    setShowDialog(false)
    setScreen("confirm")
  }

  function handleConfirm() {
    setScreen("success")
  }

  function handleDone() {
    setScreen("input")
    setInputAmount("")
    setSettlementChoice(null)
    setDialogScenario(null)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9.]/g, "")
    const parts = raw.split(".")
    if (parts.length > 2) return
    if (parts[1] && parts[1].length > 2) return
    setInputAmount(raw)
  }

  const eta = getEtaMessage()
  const isRejected = eta?.color === "text-red-600"
  const noInterestVal = val(marginWithoutInterest, fromCurrencyView)

  // ══════════════════════════════════════
  // SCREEN: Success
  // ══════════════════════════════════════
  if (screen === "success") {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
        <div className="flex items-center justify-between px-5 pt-2 pb-1 text-xs font-medium text-foreground">
          <span>12:30</span>
          <div className="flex items-center gap-1"><span>{"..."}</span><span>50%</span></div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-6">
          {/* Illustration */}
          <svg width="140" height="140" viewBox="0 0 140 140" fill="none" className="mb-6">
            <rect x="35" y="20" width="70" height="90" rx="6" fill="#f4f4f5" stroke="#d4d4d8" strokeWidth="1.5" />
            <rect x="30" y="15" width="70" height="90" rx="6" fill="#fafafa" stroke="#d4d4d8" strokeWidth="1.5" />
            <path d="M48 50 L55 50" stroke="#1a8d1a" strokeWidth="2" strokeLinecap="round" />
            <path d="M48 60 L55 60" stroke="#1a8d1a" strokeWidth="2" strokeLinecap="round" />
            <path d="M48 70 L55 70" stroke="#1a8d1a" strokeWidth="2" strokeLinecap="round" />
            <rect x="60" y="47" width="25" height="6" rx="3" fill="#e4e4e7" />
            <rect x="60" y="57" width="20" height="6" rx="3" fill="#e4e4e7" />
            <rect x="60" y="67" width="22" height="6" rx="3" fill="#e4e4e7" />
            <circle cx="90" cy="90" r="18" fill="#ffffff" stroke="#1a8d1a" strokeWidth="2" />
            <path d="M82 90 L87 95 L98 84" stroke="#1a8d1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M25 30 L20 25" stroke="#1a8d1a" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            <path d="M22 40 L16 38" stroke="#1a8d1a" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            <path d="M105 25 L110 20" stroke="#1a8d1a" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            <path d="M110 35 L116 33" stroke="#1a8d1a" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          </svg>

          <h2 className="mb-3 text-center text-xl font-semibold text-foreground">
            Your transfer funds is in progress
          </h2>
          <p className="text-center text-sm leading-relaxed text-muted-foreground">
            You can review the progress in your transfer funds history.
          </p>
        </div>

        <div className="px-4 py-4">
          <button
            type="button"
            onClick={handleDone}
            className="w-full rounded-full bg-[#1a8d1a] py-3.5 text-center text-sm font-semibold text-[#ffffff]"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════
  // SCREEN: Review and confirm
  // ══════════════════════════════════════
  if (screen === "confirm") {
    const confirmEta = getConfirmEta()
    const choiceBanner = getMarginChoiceBanner()

    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
        <div className="flex items-center justify-between px-5 pt-2 pb-1 text-xs font-medium text-foreground">
          <span>12:30</span>
          <div className="flex items-center gap-1"><span>{"..."}</span><span>50%</span></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <button type="button" className="p-1" aria-label="Go back" onClick={() => setScreen("input")}>
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-base font-semibold text-foreground">Transfer funds</h1>
          <button type="button" className="p-1" aria-label="Close" onClick={handleDone}>
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>

        {/* Title */}
        <div className="px-4 pt-2 pb-4">
          <h2 className="text-lg font-semibold text-foreground">Review and confirm</h2>
        </div>

        {/* Details card */}
        <div className="mx-4 rounded-xl border border-border bg-background">
          {/* From */}
          <div className="flex items-center justify-between px-4 py-4">
            <span className="text-sm text-muted-foreground">From account</span>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">
                {fromInfo.label} - {fromInfo.number}
              </p>
              <p className="text-xs text-muted-foreground">{fromInfo.subtitle}</p>
            </div>
          </div>

          <div className="mx-4 border-t border-border" />

          {/* To */}
          <div className="flex items-center justify-between px-4 py-4">
            <span className="text-sm text-muted-foreground">To account</span>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">
                {toAccount.label} - {toAccount.number}
              </p>
              <p className="text-xs text-muted-foreground">{toAccount.subtitle}</p>
            </div>
          </div>

          <div className="mx-4 border-t border-border" />

          {/* Amount */}
          <div className="flex items-center justify-between px-4 py-4">
            <span className="text-sm text-muted-foreground">Amount</span>
            <p className="text-sm font-semibold text-foreground">
              {fmt(amount)} {ccy}
            </p>
          </div>

          <div className="mx-4 border-t border-border" />

          {/* ETA */}
          <div className="flex items-center justify-between px-4 py-4">
            <span className="text-sm text-muted-foreground">Estimated processing</span>
            <p className="text-sm font-semibold text-foreground">{confirmEta}</p>
          </div>
        </div>

        {/* Margin choice reminder banner */}
        {choiceBanner && (
          <div className={`mx-4 mt-3 rounded-lg border ${choiceBanner.borderColor} ${choiceBanner.bgColor} px-4 py-3`}>
            <p className={`text-xs leading-relaxed ${choiceBanner.textColor}`}>{choiceBanner.text}</p>
          </div>
        )}

        {/* Funds held notice */}
        <div className="mx-4 mt-4 space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Once this request is submitted, the transfer amount of{" "}
            <strong className="text-foreground">{fmt(amount)} {ccy}</strong>{" "}
            will be held from your available balance until the transfer is completed.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Transfer requests submitted outside of business hours or on holidays will be processed the next business day.
          </p>
          <div className="pt-1">
            <p className="text-xs font-medium text-muted-foreground">Business hours:</p>
            <p className="text-xs text-muted-foreground">Monday – Friday, 6:30 am – 4:30 pm ET</p>
          </div>
        </div>

        <div className="flex-1" />

        {/* Confirm button */}
        <div className="px-4 py-4">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full rounded-full bg-[#1a8d1a] py-3.5 text-center text-sm font-semibold text-[#ffffff]"
          >
            Confirm
          </button>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════
  // SCREEN: Input (default)
  // ══════════════════════════════════════
  const fromRows = getFromRows()
  const toRows = getToRows()

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      {/* Status bar mock */}
      <div className="flex items-center justify-between px-5 pt-2 pb-1 text-xs font-medium text-foreground">
        <span>12:30</span>
        <div className="flex items-center gap-1"><span>{"..."}</span><span>50%</span></div>
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

        {eta && (
          <p className={`mt-2 text-xs font-medium ${eta.color}`}>{eta.text}</p>
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
              currencyView={fromCurrencyView}
              onCurrencyChange={setFromCurrencyView}
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
              <p className="text-sm font-semibold text-foreground">
                {toAccount.label} - {toAccount.number}
              </p>
              <p className="text-xs text-muted-foreground">{toAccount.subtitle}</p>
            </div>

            <AccountSection
              currencyView={toCurrencyView}
              onCurrencyChange={setToCurrencyView}
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
          onClick={handleNext}
          disabled={isRejected || !inputAmount}
          className="w-full rounded-full bg-[#1a8d1a] py-3.5 text-center text-sm font-semibold text-[#ffffff] disabled:opacity-40"
        >
          Next
        </button>
      </div>

      {/* ── Settlement / Interest Dialog ── */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setShowDialog(false)}
            aria-hidden="true"
          />

          <div className="relative z-10 mx-4 w-full max-w-sm rounded-2xl bg-background p-5 shadow-xl">
            <button
              type="button"
              onClick={() => setShowDialog(false)}
              className="absolute right-4 top-4 rounded-full p-1 hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm leading-relaxed text-amber-900">
                Your transfer of{" "}
                <strong>{fmt(amount)} {ccy}</strong>{" "}
                exceeds the cash amount of{" "}
                <strong>{fmt(noInterestVal)} {ccy}</strong>.
                The remaining funds are pending settlement. Please choose how you would like to proceed.
              </p>
            </div>

            {dialogScenario === "interest-only" && (
              <div className="space-y-3 mb-5">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#1a8d1a] bg-[#1a8d1a]/5 p-4">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[#1a8d1a]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#1a8d1a]" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Transfer instantly</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      Accept the interest charge on unsettled funds and transfer the full amount now.
                    </p>
                  </div>
                </label>
              </div>
            )}

            {dialogScenario === "choose" && (
              <div className="space-y-3 mb-5">
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/40 ${
                    settlementChoice === "instant" ? "border-[#1a8d1a] bg-[#1a8d1a]/5" : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="settlement"
                    className="sr-only"
                    checked={settlementChoice === "instant"}
                    onChange={() => setSettlementChoice("instant")}
                  />
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[#1a8d1a]">
                    {settlementChoice === "instant" && (
                      <span className="h-2.5 w-2.5 rounded-full bg-[#1a8d1a]" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Transfer instantly</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      Accept the interest charge on unsettled funds and transfer the full amount now.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/40 ${
                    settlementChoice === "settlement" ? "border-[#1a8d1a] bg-[#1a8d1a]/5" : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="settlement"
                    className="sr-only"
                    checked={settlementChoice === "settlement"}
                    onChange={() => setSettlementChoice("settlement")}
                  />
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[#1a8d1a]">
                    {settlementChoice === "settlement" && (
                      <span className="h-2.5 w-2.5 rounded-full bg-[#1a8d1a]" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Transfer on settlement day</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      Request to transfer on the day of settlement so that no interest charges are incurred.
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Dialog action buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleDialogProceed}
                disabled={dialogScenario === "choose" && !settlementChoice}
                className="w-full rounded-full bg-[#1a8d1a] py-3 text-center text-sm font-semibold text-[#ffffff] disabled:opacity-40"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                className="w-full rounded-full border border-border py-3 text-center text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
