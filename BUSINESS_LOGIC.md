# Internal Cash Transfer — Business Logic Document

> Auto-generated from `components/transfer-view.tsx` on 2026-03-03.
> Use this document to review and refine the business rules with a Business Analyst.

---

## 1. Overview

This prototype handles **internal cash transfers** between brokerage accounts. A client transfers money **from** one account (TFSA, MARGIN, or CASH) **to** a fixed destination account (RRSP).

The transfer currency is selected by the client (CAD or USD). All scenario logic evaluates the entered amount against the **combined** balance (both CAD and USD converted into the transfer currency), while certain insufficient-cash checks compare against the **single-currency** balance.

**FX Rate:** 1 USD = 1.37 CAD / 1 CAD = 0.73 USD

---

## 2. Accounts

| Account | Label | Number | Subtitle |
|---|---|---|---|
| From: TFSA | TFSA | 123345678 | Self-directed Individual |
| From: MARGIN | MARGIN | 123123123 | Self-directed Individual |
| From: CASH | CASH | 123456789 | Self-directed Individual |
| To (fixed) | RRSP | 123345678 | Self-directed Individual |

---

## 3. Mocked Data — Current Values

### 3.1 TFSA

| Data Point | CAD | USD | Combined CAD | Combined USD |
|---|---|---|---|---|
| Buying Power | $350 | $200 | $624 | $456 |
| Unsettled Cash | $25 | $15 | $46 | $34 |
| **Available to Transfer** (= Buying Power) | **$350** | **$200** | **$624** | **$456** |
| **Available to Transfer Today** (= Buying Power − Unsettled) | **$325** | **$185** | **$578** | **$422** |

### 3.2 CASH

| Data Point | CAD | USD | Combined CAD | Combined USD |
|---|---|---|---|---|
| Buying Power | $300 | $250 | $643 | $469 |
| Unsettled Cash | $10 | $8 | $21 | $15 |
| **Available to Transfer** (= Buying Power) | **$300** | **$250** | **$643** | **$469** |
| **Available to Transfer Today** (= Buying Power − Unsettled) | **$290** | **$242** | **$622** | **$454** |

### 3.3 MARGIN

| Data Point | CAD | USD | Combined CAD | Combined USD |
|---|---|---|---|---|
| Buying Power | $400 | $300 | $811 | $592 |
| Unsettled Cash | $100 | $75 | $203 | $148 |
| Cash Balance | $250 | $200 | $524 | $383 |
| **Available to Transfer** (= Buying Power) | **$400** | **$300** | **$811** | **$592** |
| **Available to Transfer Today** (= Buying Power − Unsettled) | **$300** | **$225** | **$608** | **$444** |
| **Available to Transfer w/o Interest** (= Cash − Unsettled) | **$150** | **$125** | **$321** | **$235** |

### 3.4 Formulas

| Formula | Description |
|---|---|
| `Available to Transfer = Buying Power` | The maximum a client can transfer |
| `Available to Transfer Today = Buying Power − Unsettled Cash` | How much can transfer without waiting for settlement |
| `Available to Transfer w/o Interest = Cash − Unsettled Cash` | (Margin only) Fully settled cash — no interest applies |
| `Cash = Without Interest + Unsettled` | (Margin only) Total cash in the account |

---

## 4. What the Client Sees in the UI

### 4.1 From Account Section — Displayed Rows

| Account | Rows Shown |
|---|---|
| TFSA | "Available to transfer" |
| CASH | "Available to transfer" |
| MARGIN | "Available to transfer" + "Cash" |

**Not shown to clients:** Unsettled Cash, Available to Transfer Today, Available to Transfer without Interest. These are used for internal validation only.

### 4.2 Currency Views

The client can toggle the From/To account balances between four views:
- **CAD** — single-currency CAD balance
- **USD** — single-currency USD balance
- **Combined CAD** — both currencies converted to CAD
- **Combined USD** — both currencies converted to USD

The **transfer currency** (CAD or USD) is selected separately via a dropdown next to the amount input.

---

## 5. Scenario Logic — Non-Margin (TFSA & CASH)

### 5.1 How it works

All comparisons use the **combined** currency view (combined-cad for CAD transfers, combined-usd for USD transfers).

```
IF amount <= Available to Transfer Today:
    → Process transfer (ETA varies by account type)
ELSE IF amount <= Available to Transfer:
    → Process transfer (longer ETA, 2-3 business days)
ELSE:
    → REJECTED (amount exceeds available)
```

### 5.2 ETA Messages (Input Screen)

| Condition | TFSA | CASH |
|---|---|---|
| amount <= Transfer Today | "This request will take between 1-2 business days." (amber) | "This request will be processed same day." (green) |
| Transfer Today < amount <= Transfer | "This request will take between 2-3 business days." (amber) | "This request will take between 2-3 business days." (amber) |
| amount > Transfer | "Amount exceeds available to transfer of $X." (red) | "Amount exceeds available to transfer of $X." (red) |

### 5.3 Confirm Screen ETA

| Condition | TFSA | CASH |
|---|---|---|
| amount <= Transfer Today | 1-2 business days | Same day |
| amount > Transfer Today | 2-3 business days | 2-3 business days |

### 5.4 Navigation

- If amount > Available to Transfer → Next button is **disabled**
- Otherwise → Next goes directly to Confirm screen (no dialog)

### 5.5 TFSA Example (CAD transfer)

| Amount | vs Today ($578) | vs Max ($624) | ETA | Next Button |
|---|---|---|---|---|
| $400 | Within | Within | 1-2 business days | Enabled |
| $578 | At boundary | Within | 1-2 business days | Enabled |
| $600 | Exceeds | Within | 2-3 business days | Enabled |
| $624 | Exceeds | At boundary | 2-3 business days | Enabled |
| $625 | Exceeds | Exceeds | Rejected | Disabled |

### 5.6 CASH Example (CAD transfer)

| Amount | vs Today ($622) | vs Max ($643) | ETA | Next Button |
|---|---|---|---|---|
| $500 | Within | Within | Same day | Enabled |
| $622 | At boundary | Within | Same day | Enabled |
| $630 | Exceeds | Within | 2-3 business days | Enabled |
| $643 | Exceeds | At boundary | 2-3 business days | Enabled |
| $644 | Exceeds | Exceeds | Rejected | Disabled |

---

## 6. Scenario Logic — MARGIN

Margin accounts have a fundamentally different flow because margin power allows the client to borrow beyond their cash balance. The key question is whether **interest** will be charged.

### 6.1 Thresholds Used

| Threshold | What it represents | Used for |
|---|---|---|
| Available to Transfer w/o Interest | Fully settled cash | Determines if transfer is interest-free |
| Available to Transfer | Buying power (max) | Determines if transfer is possible at all |

### 6.2 Current Scenario Logic (code as-is)

All comparisons use the **combined** currency view.

```
IF amount <= Available to Transfer w/o Interest (combined):
    → "same-day" — no interest, no dialog
ELSE IF amount <= Available to Transfer (combined):
    → "choose-zero" — dialog: transfer instantly (interest) or wait (no interest)
ELSE:
    → "rejected" — blocked
```

**Note:** `Available to Transfer Today` ({cad: 300, usd: 225, combinedCad: 608, combinedUsd: 444}) exists in the mocked data but is **NOT currently used** in the margin scenario logic. The code only uses `marginWithoutInterest` and `marginTransfer`. This may be a gap — see Section 7.1.

### 6.3 Margin Scenarios

| Scenario | Condition (combined view) | Dialog? | Client Action |
|---|---|---|---|
| `same-day` | amount <= w/o Interest | No | Transfer proceeds, same day, no interest |
| `choose-zero` | w/o Interest < amount <= Transfer | Yes | Client picks: instant (interest) or settlement day (no interest) |
| `rejected` | amount > Transfer | No | Next button disabled |

### 6.4 ETA Messages (Input Screen)

| Scenario | Message | Color |
|---|---|---|
| same-day | "This request will be processed same day." | Green |
| choose-zero | "Amount exceeds your cash balance. Choose to transfer now with interest or wait for settlement." | Amber |
| rejected | "Amount exceeds available to transfer of $X." | Red |

### 6.5 Settlement Dialog (choose-zero only)

**Warning banner:** "Your transfer of **$X CAD** exceeds the cash amount of **$Y CAD**. The remaining funds are pending settlement. Please choose how you would like to proceed."

Where:
- $X = the transfer amount
- $Y = Available to Transfer without Interest (combined view)

**Options:**
1. **Transfer instantly** — "Accept the interest charge on unsettled funds and transfer the full amount now."
2. **Transfer on settlement day** — "Wait for settlement day so that no interest charges are incurred."

Continue button is **disabled** until the client selects an option.

### 6.6 Confirm Screen — ETA

| Scenario | Choice | Confirm ETA |
|---|---|---|
| same-day | N/A | Same day |
| choose-zero | instant | Same day |
| choose-zero | settlement | 2-3 business days |

### 6.7 Confirm Screen — Banners

| Scenario | Choice | Banner Color | Banner Text |
|---|---|---|---|
| same-day (amount <= single-currency w/o Interest) | N/A | None | — |
| same-day (amount > single-currency w/o Interest) | N/A | Amber | "If you don't want to use margin, you need to have enough cash in the currency of the transfer you're placing." |
| choose-zero | instant | Amber | "You chose to transfer instantly. Interest charges will be applied on the unsettled funds portion of this transfer. If you don't want to use margin, you need to have enough cash in the currency of the transfer you're placing." |
| choose-zero | settlement | Green | "You chose to wait for settlement day. No interest charges will apply. Your request will be processed once funds have settled, estimated 2-3 business days." |

### 6.8 Insufficient Cash in Specific Currency (same-day with margin power banner)

This is a special sub-scenario within `same-day`. The combined balance has enough settled cash, but the **single-currency** balance does not. The transfer still proceeds without a dialog, but the confirm screen shows an amber banner warning about margin usage.

**Condition:** `amount > Available to Transfer w/o Interest (single currency)` AND `amount <= Available to Transfer w/o Interest (combined)`

**Example (CAD transfer):**
- Combined settled: $321 (combined-cad)
- Single CAD settled: $150
- Amount $200: combined says same-day, but $200 > $150 single CAD → amber banner on confirm

**Windows where this banner appears:**
- CAD transfer: $150.01 – $321.00
- USD transfer: $125.01 – $235.00

### 6.9 MARGIN Example (CAD transfer)

| Amount | vs w/o Interest ($321 combined) | vs Transfer ($811 combined) | Scenario | Dialog? | Confirm Banner |
|---|---|---|---|---|---|
| $100 | Within | Within | same-day | No | None ($100 <= $150 single CAD) |
| $150 | At single boundary | Within | same-day | No | None ($150 <= $150 single CAD) |
| $200 | Within combined, exceeds single | Within | same-day | No | Amber margin warning ($200 > $150 single CAD) |
| $321 | At combined boundary | Within | same-day | No | Amber margin warning ($321 > $150 single CAD) |
| $322 | Exceeds | Within | choose-zero | Yes | Depends on choice |
| $600 | Exceeds | Within | choose-zero | Yes | Depends on choice |
| $811 | Exceeds | At boundary | choose-zero | Yes | Depends on choice |
| $812 | Exceeds | Exceeds | rejected | No | — |

---

## 7. Known Issues & Open Questions

### 7.1 marginTransferToday is not used in margin scenario logic

The code defines `marginTransferToday` (Buying Power − Unsettled = {cad: 300, usd: 225, combinedCad: 608, combinedUsd: 444}) with values consistent with the formula. However, the `getMarginScenario()` function does not reference `marginTransferToday` at all — it only uses `marginWithoutInterest` and `marginTransfer`.

**Question:** Should `Available to Transfer Today` (= Buying Power − Unsettled) play a role in the margin scenario logic? For example:
- Should there be a distinction between amounts within Transfer Today vs above it?
- For TFSA/CASH, Transfer Today determines the ETA (faster vs slower). Should margin have similar behavior?

### 7.2 "choose-zero" name implies zero interest on settlement, but does this hold?

The `choose-zero` scenario covers the entire range from `w/o Interest` ($321 combined CAD) to `Transfer` ($811 combined CAD). For large amounts near the max, the client would be using significant margin borrowing. The banner says "No interest charges will apply" if they wait for settlement — is that accurate for amounts well above the cash balance ($524 combined CAD)?

### 7.3 Combined vs single-currency mismatch in scenario boundaries

The margin scenario logic uses **combined** currency view for thresholds (e.g., combined-cad $321 for w/o Interest). But the insufficient-cash banner uses **single** currency (e.g., cad $150). This creates a window ($150–$321 for CAD) where the transfer is `same-day` (no dialog) but shows a margin warning on confirm. Is this the intended UX?

### 7.4 Non-margin Transfer Today is used for ETA but not for blocking

For TFSA/CASH, `Transfer Today` determines the ETA message (faster vs slower), but does NOT block the transfer or trigger a dialog. The client can always transfer up to `Available to Transfer` regardless — the only difference is processing time. Is this correct?

### 7.5 Dialog warning references "cash amount" using combined w/o Interest

The dialog warning says: "exceeds the cash amount of **$Y**" where $Y = `marginWithoutInterest` in combined view. This is the settled cash threshold, not the total cash balance (`marginCash`). Is "cash amount" the right term, or should it say "settled cash" or something else?

---

## 8. User Flow Summary

```
┌─────────────────────────────────────────────────────┐
│                   INPUT SCREEN                       │
│  Client enters amount + selects currency (CAD/USD)   │
│  ETA message appears below input                     │
│  Next button enabled/disabled based on validation    │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
     Non-Margin                  Margin
          │                         │
          │               ┌─────────┴──────────┐
          │               │                    │
          │          same-day             choose-zero
          │          (no dialog)          (dialog)
          │               │                    │
          │               │         ┌──────────┴──────────┐
          │               │         │                     │
          │               │     instant              settlement
          │               │         │                     │
          ▼               ▼         ▼                     ▼
┌─────────────────────────────────────────────────────┐
│                  CONFIRM SCREEN                      │
│  From/To accounts, amount, ETA                       │
│  Margin: optional banner (interest/settlement/       │
│          insufficient cash warning)                  │
│  Confirm button                                      │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                  SUCCESS SCREEN                      │
│  "Your transfer funds is in progress"                │
│  Done button → resets to Input screen                │
└─────────────────────────────────────────────────────┘
```

---

## 9. Complete Decision Table — All Accounts, All Scenarios

### Non-Margin (TFSA)

| # | Transfer Ccy | Amount Range (combined) | ETA Message | Dialog | Confirm ETA | Confirm Banner |
|---|---|---|---|---|---|---|
| T1 | CAD | $0.01 – $578 | 1-2 business days (amber) | No | 1-2 business days | None |
| T2 | CAD | $578.01 – $624 | 2-3 business days (amber) | No | 2-3 business days | None |
| T3 | CAD | > $624 | Exceeds available (red) | No | — | — (blocked) |
| T4 | USD | $0.01 – $422 | 1-2 business days (amber) | No | 1-2 business days | None |
| T5 | USD | $422.01 – $456 | 2-3 business days (amber) | No | 2-3 business days | None |
| T6 | USD | > $456 | Exceeds available (red) | No | — | — (blocked) |

### Non-Margin (CASH)

| # | Transfer Ccy | Amount Range (combined) | ETA Message | Dialog | Confirm ETA | Confirm Banner |
|---|---|---|---|---|---|---|
| C1 | CAD | $0.01 – $622 | Same day (green) | No | Same day | None |
| C2 | CAD | $622.01 – $643 | 2-3 business days (amber) | No | 2-3 business days | None |
| C3 | CAD | > $643 | Exceeds available (red) | No | — | — (blocked) |
| C4 | USD | $0.01 – $454 | Same day (green) | No | Same day | None |
| C5 | USD | $454.01 – $469 | 2-3 business days (amber) | No | 2-3 business days | None |
| C6 | USD | > $469 | Exceeds available (red) | No | — | — (blocked) |

### MARGIN

| # | Transfer Ccy | Amount Range (combined) | Single-ccy check | Scenario | Dialog | Confirm ETA | Confirm Banner |
|---|---|---|---|---|---|---|---|
| M1 | CAD | $0.01 – $150 | <= $150 single CAD | same-day | No | Same day | None |
| M2 | CAD | $150.01 – $321 | > $150 single CAD | same-day | No | Same day | Amber: margin power warning |
| M3 | CAD | $321.01 – $811 | N/A | choose-zero | Yes | instant: Same day / settlement: 2-3 days | instant: amber interest / settlement: green no interest |
| M4 | CAD | > $811 | N/A | rejected | No | — | — (blocked) |
| M5 | USD | $0.01 – $125 | <= $125 single USD | same-day | No | Same day | None |
| M6 | USD | $125.01 – $235 | > $125 single USD | same-day | No | Same day | Amber: margin power warning |
| M7 | USD | $235.01 – $592 | N/A | choose-zero | Yes | instant: Same day / settlement: 2-3 days | instant: amber interest / settlement: green no interest |
| M8 | USD | > $592 | N/A | rejected | No | — | — (blocked) |
