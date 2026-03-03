# Transfer Test Case Scenarios

---

## Definitions and Formulas

- **Available to Transfer** = Buying Power. The maximum a client can transfer.
- **Available to Transfer Today** = Buying Power - Unsettled Cash. How much can transfer without waiting for settlement.
- **Available to Transfer without Interest** = Cash Balance - Unsettled Cash. (Margin only) Fully settled cash — no interest applies.
- **Cash Balance** = Available to Transfer without Interest + Unsettled Cash. (Margin only) Total cash in the account.
- **FX Rate:** 1 USD = 1.37 CAD / 1 CAD = 0.73 USD

---

## Mocked Data

### TFSA

| Data Point | CAD | USD | Combined CAD | Combined USD |
|---|---|---|---|---|
| Available to Transfer | $350 | $200 | $624 | $456 |
| Available to Transfer Today | $325 | $185 | $578 | $422 |
| Unsettled Cash | $25 | $15 | $46 | $34 |

### CASH

| Data Point | CAD | USD | Combined CAD | Combined USD |
|---|---|---|---|---|
| Available to Transfer | $300 | $250 | $643 | $469 |
| Available to Transfer Today | $290 | $242 | $622 | $454 |
| Unsettled Cash | $10 | $8 | $21 | $15 |

### MARGIN

| Data Point | CAD | USD | Combined CAD | Combined USD |
|---|---|---|---|---|
| Available to Transfer | $400 | $300 | $811 | $592 |
| Available to Transfer Today | $300 | $225 | $608 | $444 |
| Available to Transfer without Interest | $150 | $125 | $321 | $235 |
| Cash Balance | $250 | $200 | $524 | $383 |
| Unsettled Cash | $100 | $75 | $203 | $148 |

---

## Scenario Logic Summary

### Non-Margin (TFSA and CASH)

All comparisons use the **combined** currency view matching the transfer currency.

- **amount <= Available to Transfer Today** → Fast ETA (TFSA: 1-2 days, CASH: Same day)
- **Available to Transfer Today < amount <= Available to Transfer** → Slower ETA (2-3 days)
- **amount > Available to Transfer** → Rejected, Next button disabled

**Confirm screen banners (independent checks, can appear together):**

- **FX message** (blue) — appears when `amount > Available to Transfer (single currency)`. The account lacks sufficient funds in the transfer currency; the remaining amount will be converted from the other currency.
- **Unsettled cash message** (amber) — appears when `amount > Available to Transfer Today (combined)`. The transfer taps into unsettled funds; must wait for settlement to process.

### Margin

All comparisons use the **combined** currency view matching the transfer currency.

- **amount <= Available to Transfer without Interest (combined)** → "same-day", no dialog
  - Sub-check on confirm screen: if amount > Available to Transfer without Interest **(single currency)** → amber multi-currency warning banner
- **Available to Transfer without Interest (combined) < amount <= Cash Balance (combined)** → "choose-zero", dialog appears with two options (instant / settlement)
- **Cash Balance (combined) < amount <= Available to Transfer (combined)** → "margin-borrow", no dialog, interest always applies
- **amount > Available to Transfer (combined)** → Rejected, Next button disabled

---

## Test Cases — TFSA

### TFSA - CAD Transfer

Thresholds used: Available to Transfer Today = **$578** (combined CAD), Available to Transfer = **$624** (combined CAD)

| TC# | Amount | Scenario | Input Screen ETA | ETA Color | Next Button | Dialog? | Confirm ETA | Confirm Banner |
|---|---|---|---|---|---|---|---|---|
| T-CAD-01 | $0 | No input | No message | — | Disabled (no input) | No | — | — |
| T-CAD-02 | $100 | amount <= Available to Transfer Today ($578) | "This request will take between 1-2 business days." | Amber | Enabled | No | 1-2 business days | None |
| T-CAD-03 | $578 | amount = Available to Transfer Today (boundary) | "This request will take between 1-2 business days." | Amber | Enabled | No | 1-2 business days | Blue: FX message ($578 > $350 single CAD) |
| T-CAD-04 | $578.01 | amount just above Available to Transfer Today | "This request will take between 2-3 business days." | Amber | Enabled | No | 2-3 business days | Blue: FX message + Amber: Unsettled cash message |
| T-CAD-05 | $600 | Available to Transfer Today < amount < Available to Transfer | "This request will take between 2-3 business days." | Amber | Enabled | No | 2-3 business days | Blue: FX message + Amber: Unsettled cash message |
| T-CAD-06 | $624 | amount = Available to Transfer (boundary) | "This request will take between 2-3 business days." | Amber | Enabled | No | 2-3 business days | Blue: FX message + Amber: Unsettled cash message |
| T-CAD-07 | $624.01 | amount just above Available to Transfer | "Amount exceeds available to transfer of $624.00." | Red | Disabled | No | — | — |
| T-CAD-08 | $1000 | amount well above Available to Transfer | "Amount exceeds available to transfer of $624.00." | Red | Disabled | No | — | — |

### TFSA - USD Transfer

Thresholds used: Available to Transfer Today = **$422** (combined USD), Available to Transfer = **$456** (combined USD)

| TC# | Amount | Scenario | Input Screen ETA | ETA Color | Next Button | Dialog? | Confirm ETA | Confirm Banner |
|---|---|---|---|---|---|---|---|---|
| T-USD-01 | $0 | No input | No message | — | Disabled (no input) | No | — | — |
| T-USD-02 | $100 | amount <= Available to Transfer Today ($422) | "This request will take between 1-2 business days." | Amber | Enabled | No | 1-2 business days | None |
| T-USD-03 | $422 | amount = Available to Transfer Today (boundary) | "This request will take between 1-2 business days." | Amber | Enabled | No | 1-2 business days | Blue: FX message ($422 > $200 single USD) |
| T-USD-04 | $422.01 | amount just above Available to Transfer Today | "This request will take between 2-3 business days." | Amber | Enabled | No | 2-3 business days | Blue: FX message + Amber: Unsettled cash message |
| T-USD-05 | $440 | Available to Transfer Today < amount < Available to Transfer | "This request will take between 2-3 business days." | Amber | Enabled | No | 2-3 business days | Blue: FX message + Amber: Unsettled cash message |
| T-USD-06 | $456 | amount = Available to Transfer (boundary) | "This request will take between 2-3 business days." | Amber | Enabled | No | 2-3 business days | Blue: FX message + Amber: Unsettled cash message |
| T-USD-07 | $456.01 | amount just above Available to Transfer | "Amount exceeds available to transfer of $456.00." | Red | Disabled | No | — | — |
| T-USD-08 | $1000 | amount well above Available to Transfer | "Amount exceeds available to transfer of $456.00." | Red | Disabled | No | — | — |

---

## Test Cases — CASH

### CASH - CAD Transfer

Thresholds used: Available to Transfer Today = **$622** (combined CAD), Available to Transfer = **$643** (combined CAD)

| TC# | Amount | Scenario | Input Screen ETA | ETA Color | Next Button | Dialog? | Confirm ETA | Confirm Banner |
|---|---|---|---|---|---|---|---|---|
| C-CAD-01 | $0 | No input | No message | — | Disabled (no input) | No | — | — |
| C-CAD-02 | $100 | amount <= Available to Transfer Today ($622) | "This request will be processed same day." | Green | Enabled | No | Same day | None |
| C-CAD-03 | $622 | amount = Available to Transfer Today (boundary) | "This request will be processed same day." | Green | Enabled | No | Same day | Blue: FX message ($622 > $300 single CAD) |
| C-CAD-04 | $622.01 | amount just above Available to Transfer Today | "This request will take between 2-3 business days." | Amber | Enabled | No | 2-3 business days | Blue: FX message + Amber: Unsettled cash message |
| C-CAD-05 | $630 | Available to Transfer Today < amount < Available to Transfer | "This request will take between 2-3 business days." | Amber | Enabled | No | 2-3 business days | Blue: FX message + Amber: Unsettled cash message |
| C-CAD-06 | $643 | amount = Available to Transfer (boundary) | "This request will take between 2-3 business days." | Amber | Enabled | No | 2-3 business days | Blue: FX message + Amber: Unsettled cash message |
| C-CAD-07 | $643.01 | amount just above Available to Transfer | "Amount exceeds available to transfer of $643.00." | Red | Disabled | No | — | — |
| C-CAD-08 | $1000 | amount well above Available to Transfer | "Amount exceeds available to transfer of $643.00." | Red | Disabled | No | — | — |

### CASH - USD Transfer

Thresholds used: Available to Transfer Today = **$454** (combined USD), Available to Transfer = **$469** (combined USD)

| TC# | Amount | Scenario | Input Screen ETA | ETA Color | Next Button | Dialog? | Confirm ETA | Confirm Banner |
|---|---|---|---|---|---|---|---|---|
| C-USD-01 | $0 | No input | No message | — | Disabled (no input) | No | — | — |
| C-USD-02 | $100 | amount <= Available to Transfer Today ($454) | "This request will be processed same day." | Green | Enabled | No | Same day | None |
| C-USD-03 | $454 | amount = Available to Transfer Today (boundary) | "This request will be processed same day." | Green | Enabled | No | Same day | Blue: FX message ($454 > $250 single USD) |
| C-USD-04 | $454.01 | amount just above Available to Transfer Today | "This request will take between 2-3 business days." | Amber | Enabled | No | 2-3 business days | Blue: FX message + Amber: Unsettled cash message |
| C-USD-05 | $460 | Available to Transfer Today < amount < Available to Transfer | "This request will take between 2-3 business days." | Amber | Enabled | No | 2-3 business days | Blue: FX message + Amber: Unsettled cash message |
| C-USD-06 | $469 | amount = Available to Transfer (boundary) | "This request will take between 2-3 business days." | Amber | Enabled | No | 2-3 business days | Blue: FX message + Amber: Unsettled cash message |
| C-USD-07 | $469.01 | amount just above Available to Transfer | "Amount exceeds available to transfer of $469.00." | Red | Disabled | No | — | — |
| C-USD-08 | $1000 | amount well above Available to Transfer | "Amount exceeds available to transfer of $469.00." | Red | Disabled | No | — | — |

---

## Test Cases — MARGIN

### MARGIN - CAD Transfer

Thresholds used:
- Available to Transfer without Interest = **$150** (single CAD) / **$321** (combined CAD)
- Available to Transfer = **$811** (combined CAD)
- Cash Balance = **$524** (combined CAD)

#### Scenario: same-day (amount <= $321 combined CAD)

| TC# | Amount | Sub-check | Input Screen ETA | ETA Color | Next Button | Dialog? | Confirm ETA | Confirm Banner |
|---|---|---|---|---|---|---|---|---|
| M-CAD-01 | $0 | No input | No message | — | Disabled (no input) | No | — | — |
| M-CAD-02 | $100 | $100 <= $150 single CAD | "This request will be processed same day." | Green | Enabled | No | Same day | None |
| M-CAD-03 | $150 | $150 = $150 single CAD (boundary) | "This request will be processed same day." | Green | Enabled | No | Same day | None |
| M-CAD-04 | $150.01 | $150.01 > $150 single CAD, but <= $321 combined CAD | "This request will be processed same day." | Green | Enabled | No | Same day | Amber: "This transfer uses funds from multiple currencies. To avoid margin, ensure you have enough settled cash in this transfer's currency." |
| M-CAD-05 | $200 | $200 > $150 single CAD, but <= $321 combined CAD | "This request will be processed same day." | Green | Enabled | No | Same day | Amber: "This transfer uses funds from multiple currencies. To avoid margin, ensure you have enough settled cash in this transfer's currency." |
| M-CAD-06 | $321 | $321 = $321 combined CAD (boundary), $321 > $150 single CAD | "This request will be processed same day." | Green | Enabled | No | Same day | Amber: "This transfer uses funds from multiple currencies. To avoid margin, ensure you have enough settled cash in this transfer's currency." |

#### Scenario: choose-zero ($321 < amount <= $524 combined CAD)

Each test case has two sub-paths: **instant** and **settlement**.

| TC# | Amount | Input Screen ETA | ETA Color | Next Button | Dialog? | Dialog Warning Text |
|---|---|---|---|---|---|---|
| M-CAD-07 | $321.01 | "Amount exceeds your settled cash. Choose to transfer now with interest or wait for settlement." | Amber | Enabled | Yes | "Your transfer of $321.01 CAD exceeds your settled cash of $321.00 CAD. The remaining funds are pending settlement. Please choose how you would like to proceed." |
| M-CAD-08 | $400 | (same ETA message) | Amber | Enabled | Yes | "Your transfer of $400.00 CAD exceeds your settled cash of $321.00 CAD..." |
| M-CAD-09 | $524 | (same ETA message, boundary) | Amber | Enabled | Yes | "Your transfer of $524.00 CAD exceeds your settled cash of $321.00 CAD..." |

**Confirm screen outcomes for each choose-zero test case above:**

| TC# | Choice | Confirm ETA | Confirm Banner Color | Confirm Banner Text |
|---|---|---|---|---|
| M-CAD-07a | instant | Same day | Amber | "You chose to transfer instantly. Interest charges will be applied on the unsettled funds portion of this transfer. This transfer uses funds from multiple currencies. To avoid margin, ensure you have enough settled cash in this transfer's currency." |
| M-CAD-07b | settlement | 2-3 business days | Green | "You chose to wait for settlement day. No interest charges will apply. Your request will be processed once funds have settled, estimated 2-3 business days." |
| M-CAD-08a | instant | Same day | Amber | (same as M-CAD-07a) |
| M-CAD-08b | settlement | 2-3 business days | Green | (same as M-CAD-07b) |
| M-CAD-09a | instant | Same day | Amber | (same as M-CAD-07a) |
| M-CAD-09b | settlement | 2-3 business days | Green | (same as M-CAD-07b) |

#### Scenario: margin-borrow ($524 < amount <= $811 combined CAD)

No dialog. Interest always applies. Goes directly to confirm screen.

| TC# | Amount | Input Screen ETA | ETA Color | Next Button | Dialog? | Confirm ETA | Confirm Banner |
|---|---|---|---|---|---|---|---|
| M-CAD-10 | $524.01 | "Amount exceeds your cash balance. Interest charges will apply." | Amber | Enabled | No | Same day | Amber: "Interest charges will be applied as your transfer amount exceeds your cash balance. This transfer uses funds from multiple currencies. To avoid margin, ensure you have enough settled cash in this transfer's currency." |
| M-CAD-11 | $700 | (same ETA message) | Amber | Enabled | No | Same day | Amber: (same as M-CAD-10) |
| M-CAD-12 | $811 | (same ETA message, boundary) | Amber | Enabled | No | Same day | Amber: (same as M-CAD-10) |

#### Scenario: rejected (amount > $811 combined CAD)

| TC# | Amount | Input Screen ETA | ETA Color | Next Button | Dialog? | Confirm ETA | Confirm Banner |
|---|---|---|---|---|---|---|---|
| M-CAD-13 | $811.01 | "Amount exceeds available to transfer of $811.00." | Red | Disabled | No | — | — |
| M-CAD-14 | $1000 | "Amount exceeds available to transfer of $811.00." | Red | Disabled | No | — | — |

---

### MARGIN - USD Transfer

Thresholds used:
- Available to Transfer without Interest = **$125** (single USD) / **$235** (combined USD)
- Available to Transfer = **$592** (combined USD)
- Cash Balance = **$383** (combined USD)

#### Scenario: same-day (amount <= $235 combined USD)

| TC# | Amount | Sub-check | Input Screen ETA | ETA Color | Next Button | Dialog? | Confirm ETA | Confirm Banner |
|---|---|---|---|---|---|---|---|---|
| M-USD-01 | $0 | No input | No message | — | Disabled (no input) | No | — | — |
| M-USD-02 | $50 | $50 <= $125 single USD | "This request will be processed same day." | Green | Enabled | No | Same day | None |
| M-USD-03 | $125 | $125 = $125 single USD (boundary) | "This request will be processed same day." | Green | Enabled | No | Same day | None |
| M-USD-04 | $125.01 | $125.01 > $125 single USD, but <= $235 combined USD | "This request will be processed same day." | Green | Enabled | No | Same day | Amber: "This transfer uses funds from multiple currencies. To avoid margin, ensure you have enough settled cash in this transfer's currency." |
| M-USD-05 | $200 | $200 > $125 single USD, but <= $235 combined USD | "This request will be processed same day." | Green | Enabled | No | Same day | Amber: "This transfer uses funds from multiple currencies. To avoid margin, ensure you have enough settled cash in this transfer's currency." |
| M-USD-06 | $235 | $235 = $235 combined USD (boundary), $235 > $125 single USD | "This request will be processed same day." | Green | Enabled | No | Same day | Amber: "This transfer uses funds from multiple currencies. To avoid margin, ensure you have enough settled cash in this transfer's currency." |

#### Scenario: choose-zero ($235 < amount <= $383 combined USD)

Each test case has two sub-paths: **instant** and **settlement**.

| TC# | Amount | Input Screen ETA | ETA Color | Next Button | Dialog? | Dialog Warning Text |
|---|---|---|---|---|---|---|
| M-USD-07 | $235.01 | "Amount exceeds your settled cash. Choose to transfer now with interest or wait for settlement." | Amber | Enabled | Yes | "Your transfer of $235.01 USD exceeds your settled cash of $235.00 USD. The remaining funds are pending settlement. Please choose how you would like to proceed." |
| M-USD-08 | $300 | (same ETA message) | Amber | Enabled | Yes | "Your transfer of $300.00 USD exceeds your settled cash of $235.00 USD..." |
| M-USD-09 | $383 | (same ETA message, boundary) | Amber | Enabled | Yes | "Your transfer of $383.00 USD exceeds your settled cash of $235.00 USD..." |

**Confirm screen outcomes for each choose-zero test case above:**

| TC# | Choice | Confirm ETA | Confirm Banner Color | Confirm Banner Text |
|---|---|---|---|---|
| M-USD-07a | instant | Same day | Amber | "You chose to transfer instantly. Interest charges will be applied on the unsettled funds portion of this transfer. This transfer uses funds from multiple currencies. To avoid margin, ensure you have enough settled cash in this transfer's currency." |
| M-USD-07b | settlement | 2-3 business days | Green | "You chose to wait for settlement day. No interest charges will apply. Your request will be processed once funds have settled, estimated 2-3 business days." |
| M-USD-08a | instant | Same day | Amber | (same as M-USD-07a) |
| M-USD-08b | settlement | 2-3 business days | Green | (same as M-USD-07b) |
| M-USD-09a | instant | Same day | Amber | (same as M-USD-07a) |
| M-USD-09b | settlement | 2-3 business days | Green | (same as M-USD-07b) |

#### Scenario: margin-borrow ($383 < amount <= $592 combined USD)

No dialog. Interest always applies. Goes directly to confirm screen.

| TC# | Amount | Input Screen ETA | ETA Color | Next Button | Dialog? | Confirm ETA | Confirm Banner |
|---|---|---|---|---|---|---|---|
| M-USD-10 | $383.01 | "Amount exceeds your cash balance. Interest charges will apply." | Amber | Enabled | No | Same day | Amber: "Interest charges will be applied as your transfer amount exceeds your cash balance. This transfer uses funds from multiple currencies. To avoid margin, ensure you have enough settled cash in this transfer's currency." |
| M-USD-11 | $500 | (same ETA message) | Amber | Enabled | No | Same day | Amber: (same as M-USD-10) |
| M-USD-12 | $592 | (same ETA message, boundary) | Amber | Enabled | No | Same day | Amber: (same as M-USD-10) |

#### Scenario: rejected (amount > $592 combined USD)

| TC# | Amount | Input Screen ETA | ETA Color | Next Button | Dialog? | Confirm ETA | Confirm Banner |
|---|---|---|---|---|---|---|---|
| M-USD-13 | $592.01 | "Amount exceeds available to transfer of $592.00." | Red | Disabled | No | — | — |
| M-USD-14 | $1000 | "Amount exceeds available to transfer of $592.00." | Red | Disabled | No | — | — |

---

## Test Cases — Success Screen (All Accounts)

| TC# | Precondition | Expected Heading | Expected Body | Known Issue |
|---|---|---|---|---|
| S-01 | Any successful transfer reaches success screen | "Your internal funds transfer is in progress" | "You can review the progress in your internal funds transfer history." | — |
| S-02 | Click "Done" on success screen | Returns to input screen, amount cleared, settlement choice reset | — | — |

---

## Test Cases — Dialog Behavior (Margin choose-zero only)

| TC# | Action | Expected Result |
|---|---|---|
| D-01 | Open dialog, no option selected | Continue button is disabled |
| D-02 | Select "Transfer instantly" | Continue button becomes enabled |
| D-03 | Select "Transfer on settlement day" | Continue button becomes enabled |
| D-04 | Click Cancel in dialog | Dialog closes, stays on input screen |
| D-05 | Click backdrop overlay behind dialog | Dialog closes, stays on input screen |

---

## Total Test Case Count

- TFSA CAD: 8 cases (T-CAD-01 through T-CAD-08)
- TFSA USD: 8 cases (T-USD-01 through T-USD-08)
- CASH CAD: 8 cases (C-CAD-01 through C-CAD-08)
- CASH USD: 8 cases (C-USD-01 through C-USD-08)
- MARGIN CAD: 14 input cases + 6 confirm sub-cases = 20 (M-CAD-01 through M-CAD-14, plus a/b variants)
- MARGIN USD: 14 input cases + 6 confirm sub-cases = 20 (M-USD-01 through M-USD-14, plus a/b variants)
- Success screen: 2 cases (S-01, S-02)
- Dialog behavior: 5 cases (D-01 through D-05)

**Grand total: 79 test scenarios**
