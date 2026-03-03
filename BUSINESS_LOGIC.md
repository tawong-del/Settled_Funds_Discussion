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
| Cash Balance | Total actual cash (settled + unsettled) | Determines if "wait for settlement" is valid (no interest) |
| Available to Transfer | Buying power (max) | Determines if transfer is possible at all |

### 6.2 Scenario Logic

All comparisons use the **combined** currency view.

```
IF amount <= Available to Transfer w/o Interest (combined):
    → "same-day" — no interest, no dialog
ELSE IF amount <= Cash Balance (combined):
    → "choose-zero" — dialog: transfer instantly (interest) or wait for settlement (no interest)
ELSE IF amount <= Available to Transfer (combined):
    → "margin-borrow" — no dialog, interest always applies (using margin borrowing)
ELSE:
    → "rejected" — blocked
```

**Note:** `Available to Transfer Today` ({cad: 300, usd: 225, combinedCad: 608, combinedUsd: 444}) exists in the mocked data but is **NOT currently used** in the margin scenario logic. It is kept for potential future use.

### 6.3 Margin Scenarios

| Scenario | Condition (combined view) | Dialog? | Client Action |
|---|---|---|---|
| `same-day` | amount <= w/o Interest | No | Transfer proceeds, same day, no interest |
| `choose-zero` | w/o Interest < amount <= Cash Balance | Yes | Client picks: instant (interest) or settlement day (no interest) |
| `margin-borrow` | Cash Balance < amount <= Transfer | No | Transfer proceeds, same day, interest always applies |
| `rejected` | amount > Transfer | No | Next button disabled |

### 6.4 ETA Messages (Input Screen)

| Scenario | Message | Color |
|---|---|---|
| same-day | "This request will be processed same day." | Green |
| choose-zero | "Amount exceeds your settled cash. Choose to transfer now with interest or wait for settlement." | Amber |
| margin-borrow | "Amount exceeds your cash balance. Interest charges will apply." | Amber |
| rejected | "Amount exceeds available to transfer of $X." | Red |

### 6.5 Settlement Dialog (choose-zero only)

**Warning banner:** "Your transfer of **$X CAD** exceeds your settled cash of **$Y CAD**. The remaining funds are pending settlement. Please choose how you would like to proceed."

Where:
- $X = the transfer amount
- $Y = Available to Transfer without Interest (combined view)

**Options:**
1. **Transfer instantly** — "Accept the interest charge on unsettled funds and transfer the full amount now."
2. **Transfer on settlement day** — "Wait for settlement day so that no interest charges are incurred."

Continue button is **disabled** until the client selects an option.

**Note:** The `margin-borrow` scenario does NOT show a dialog. Since the amount exceeds total cash, the "wait for settlement = no interest" option is not valid, so the client goes directly to the confirm screen.

### 6.6 Confirm Screen — ETA

| Scenario | Choice | Confirm ETA |
|---|---|---|
| same-day | N/A | Same day |
| choose-zero | instant | Same day |
| choose-zero | settlement | 2-3 business days |
| margin-borrow | N/A | Same day |

### 6.7 Confirm Screen — Banners

| Scenario | Choice | Banner Color | Banner Text |
|---|---|---|---|
| same-day (amount <= single-currency w/o Interest) | N/A | None | — |
| same-day (amount > single-currency w/o Interest) | N/A | Amber | "This transfer uses funds from multiple currencies. To avoid margin, ensure you have enough settled cash in this transfer's currency." |
| choose-zero | instant | Amber | "You chose to transfer instantly. Interest charges will be applied on the unsettled funds portion of this transfer. This transfer uses funds from multiple currencies. To avoid margin, ensure you have enough settled cash in this transfer's currency." |
| choose-zero | settlement | Green | "You chose to wait for settlement day. No interest charges will apply. Your request will be processed once funds have settled, estimated 2-3 business days." |
| margin-borrow | N/A | Amber | "Interest charges will be applied as your transfer amount exceeds your cash balance. This transfer uses funds from multiple currencies. To avoid margin, ensure you have enough settled cash in this transfer's currency." |

### 6.8 Combined vs Single-Currency Threshold Behavior

The margin scenario logic uses two different threshold scopes for different purposes:

- **Combined thresholds** (both currencies converted into the transfer currency) determine which **scenario** applies. This is because the client's total purchasing power spans both CAD and USD balances.
- **Single-currency thresholds** are used for the **insufficient-cash banner** on the confirm screen. This warns the client when their transfer amount exceeds their balance in the specific transfer currency, meaning FX conversion from the other currency is required.

This design creates windows where a transfer is `same-day` (no dialog needed) but the confirm screen still shows an amber banner:

| Transfer Currency | Single-currency w/o Interest | Combined w/o Interest | Amber Banner Window |
|---|---|---|---|
| CAD | $150 | $321 | $150.01 – $321.00 |
| USD | $125 | $235 | $125.01 – $235.00 |

In these windows, the combined balance has enough settled cash for a same-day transfer, but the single-currency balance does not — meaning funds from the other currency will be converted via FX.

### 6.9 MARGIN Example (CAD transfer)

| Amount | vs w/o Interest ($321 combined) | vs Cash ($524 combined) | vs Transfer ($811 combined) | Scenario | Dialog? | Confirm Banner |
|---|---|---|---|---|---|---|
| $100 | Within | Within | Within | same-day | No | None ($100 <= $150 single CAD) |
| $150 | At single boundary | Within | Within | same-day | No | None ($150 <= $150 single CAD) |
| $200 | Within combined, exceeds single | Within | Within | same-day | No | Amber: multi-currency warning |
| $321 | At combined boundary | Within | Within | same-day | No | Amber: multi-currency warning |
| $322 | Exceeds | Within | Within | choose-zero | Yes | Depends on choice |
| $500 | Exceeds | Within | Within | choose-zero | Yes | Depends on choice |
| $524 | Exceeds | At boundary | Within | choose-zero | Yes | Depends on choice |
| $525 | Exceeds | Exceeds | Within | margin-borrow | No | Amber: interest + multi-currency |
| $700 | Exceeds | Exceeds | Within | margin-borrow | No | Amber: interest + multi-currency |
| $811 | Exceeds | Exceeds | At boundary | margin-borrow | No | Amber: interest + multi-currency |
| $812 | Exceeds | Exceeds | Exceeds | rejected | No | — |

---

## 7. Known Issues & Open Questions

### 7.1 marginTransferToday is not used in margin scenario logic

The code defines `marginTransferToday` (Buying Power − Unsettled = {cad: 300, usd: 225, combinedCad: 608, combinedUsd: 444}) with values consistent with the formula. However, the `getMarginScenario()` function does not reference `marginTransferToday` at all — it only uses `marginWithoutInterest` and `marginTransfer`.

**Question:** Should `Available to Transfer Today` (= Buying Power − Unsettled) play a role in the margin scenario logic? For example:
- Should there be a distinction between amounts within Transfer Today vs above it?
- For TFSA/CASH, Transfer Today determines the ETA (faster vs slower). Should margin have similar behavior?

### ~~7.2 "choose-zero" interest accuracy~~ — RESOLVED

The `choose-zero` scenario is now limited to amounts within the total cash balance (`marginCash`). For these amounts, "wait for settlement = no interest" is accurate because the entire transfer is within actual cash. Amounts above cash are handled by the new `margin-borrow` scenario, which always applies interest.

### ~~7.3 Combined vs single-currency behavior~~ — DOCUMENTED

This is intentional and now documented in Section 6.8. Combined thresholds determine the scenario; single-currency thresholds trigger the multi-currency warning banner.

### 7.4 Non-margin Transfer Today is used for ETA but not for blocking

For TFSA/CASH, `Transfer Today` determines the ETA message (faster vs slower), but does NOT block the transfer or trigger a dialog. The client can always transfer up to `Available to Transfer` regardless — the only difference is processing time. Is this correct?

### ~~7.5 Dialog warning terminology~~ — RESOLVED

The dialog warning now says "exceeds your settled cash of **$Y**" instead of "exceeds the cash amount of **$Y**". This accurately describes that $Y is the settled cash threshold.

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
          │               ┌─────────┴──────────────────────┐
          │               │                    │             │
          │          same-day             choose-zero   margin-borrow
          │          (no dialog)          (dialog)      (no dialog)
          │               │                    │             │
          │               │         ┌──────────┴──────┐      │
          │               │         │                 │      │
          │               │     instant          settlement  │
          │               │         │                 │      │
          ▼               ▼         ▼                 ▼      ▼
┌─────────────────────────────────────────────────────────────┐
│                  CONFIRM SCREEN                              │
│  From/To accounts, amount, ETA                               │
│  Margin: optional banner (interest/settlement/               │
│          multi-currency warning)                             │
│  Confirm button                                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  SUCCESS SCREEN                              │
│  "Your internal funds transfer is in progress"               │
│  Done button → resets to Input screen                        │
└─────────────────────────────────────────────────────────────┘
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
| M2 | CAD | $150.01 – $321 | > $150 single CAD | same-day | No | Same day | Amber: multi-currency warning |
| M3 | CAD | $321.01 – $524 | N/A | choose-zero | Yes | instant: Same day / settlement: 2-3 days | instant: amber interest / settlement: green no interest |
| M4 | CAD | $524.01 – $811 | N/A | margin-borrow | No | Same day | Amber: interest + multi-currency |
| M5 | CAD | > $811 | N/A | rejected | No | — | — (blocked) |
| M6 | USD | $0.01 – $125 | <= $125 single USD | same-day | No | Same day | None |
| M7 | USD | $125.01 – $235 | > $125 single USD | same-day | No | Same day | Amber: multi-currency warning |
| M8 | USD | $235.01 – $383 | N/A | choose-zero | Yes | instant: Same day / settlement: 2-3 days | instant: amber interest / settlement: green no interest |
| M9 | USD | $383.01 – $592 | N/A | margin-borrow | No | Same day | Amber: interest + multi-currency |
| M10 | USD | > $592 | N/A | rejected | No | — | — (blocked) |
