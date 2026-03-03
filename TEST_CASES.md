# Transfer Test Case Scenarios

---

## Definitions and Formulas

- **Available to Transfer** = Buying Power. The maximum a client can transfer.
- **Available to Transfer Today** = Buying Power - Unsettled Cash. How much can transfer without waiting for settlement.
- **Available to Transfer without Interest** = Cash Balance - Unsettled Cash. (Margin only) Fully settled cash -- no interest applies.
- **Cash Balance** = Available to Transfer without Interest + Unsettled Cash. (Margin only) Total cash in the account.
- **FX Rate:** 1 USD = 1.37 CAD / 1 CAD = 0.73 USD
- **Interest Rate:** 0.01% per day on the amount subject to interest

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
| Cash Balance | $250 | $200 | $524 | $383 |
| Avail. to Transfer without Interest | $150 | $125 | $321 | $235 |
| Unsettled Cash | $100 | $75 | $203 | $148 |

---

## Scenario Logic Summary

### Non-Margin (TFSA and CASH)

All comparisons use the **combined** currency view matching the transfer currency.

- **amount <= Available to Transfer Today (combined)** -- Fast ETA:
  - CASH: "Same day" only if **also** amount <= Available to Transfer Today (single currency). Otherwise "1-2 business days" (FX needed).
  - TFSA: "1-2 business days"
- **Available to Transfer Today (combined) < amount <= Available to Transfer (combined)** -- "2-3 business days"
- **amount > Available to Transfer (combined)** -- Rejected

**Confirm screen banners:**

- **FX message** (blue) -- appears when `amount > Available to Transfer (single currency)`.

### Margin

Interest thresholds use **single-currency** values. Rejection uses **combined** (total buying power).

- **amount <= Avail. to Transfer without Interest (single currency)** -- "same-day", no interest
- **Avail. to Transfer without Interest < amount <= Cash Balance (single currency)** -- "choose-zero": dialog with instant/settlement choice. No ETA shown on input screen.
- **Cash Balance (single currency) < amount <= Available to Transfer (combined)** -- "margin-borrow": same day, interest always applies, no dialog
- **amount > Available to Transfer (combined)** -- Rejected

**Confirm screen:**

- Interest details (Amount subject to interest + Estimated interest per day) shown when interest applies: `margin-borrow` always, `choose-zero` + instant.
- Banner shown for margin-borrow and choose-zero scenarios.

---

## Test Cases -- TFSA

### TFSA - CAD Transfer

Thresholds: Today = **$578** (combined CAD), Max = **$624** (combined CAD), Single CAD max = **$350**

| TC# | Amount | Input ETA | ETA Color | Next | Confirm ETA | Confirm Banner |
|---|---|---|---|---|---|---|
| T-CAD-01 | $0 | No message | -- | Disabled | -- | -- |
| T-CAD-02 | $100 | 1-2 business days | Grey | Enabled | 1-2 business days | None |
| T-CAD-03 | $350 | 1-2 business days | Grey | Enabled | 1-2 business days | None |
| T-CAD-04 | $351 | 1-2 business days | Grey | Enabled | 1-2 business days | Blue: FX ($351 > $350 single CAD) |
| T-CAD-05 | $578 | 1-2 business days | Grey | Enabled | 1-2 business days | Blue: FX |
| T-CAD-06 | $578.01 | 2-3 business days | Grey | Enabled | 2-3 business days | Blue: FX |
| T-CAD-07 | $624 | 2-3 business days | Grey | Enabled | 2-3 business days | Blue: FX |
| T-CAD-08 | $624.01 | Exceeds $624.00 | Red | Disabled | -- | -- |
| T-CAD-09 | $1000 | Exceeds $624.00 | Red | Disabled | -- | -- |

### TFSA - USD Transfer

Thresholds: Today = **$422** (combined USD), Max = **$456** (combined USD), Single USD max = **$200**

| TC# | Amount | Input ETA | ETA Color | Next | Confirm ETA | Confirm Banner |
|---|---|---|---|---|---|---|
| T-USD-01 | $0 | No message | -- | Disabled | -- | -- |
| T-USD-02 | $100 | 1-2 business days | Grey | Enabled | 1-2 business days | None |
| T-USD-03 | $200 | 1-2 business days | Grey | Enabled | 1-2 business days | None |
| T-USD-04 | $201 | 1-2 business days | Grey | Enabled | 1-2 business days | Blue: FX ($201 > $200 single USD) |
| T-USD-05 | $422 | 1-2 business days | Grey | Enabled | 1-2 business days | Blue: FX |
| T-USD-06 | $422.01 | 2-3 business days | Grey | Enabled | 2-3 business days | Blue: FX |
| T-USD-07 | $456 | 2-3 business days | Grey | Enabled | 2-3 business days | Blue: FX |
| T-USD-08 | $456.01 | Exceeds $456.00 | Red | Disabled | -- | -- |
| T-USD-09 | $1000 | Exceeds $456.00 | Red | Disabled | -- | -- |

---

## Test Cases -- CASH

### CASH - CAD Transfer

Thresholds: Today = **$622** (combined CAD), Max = **$643** (combined CAD), Single CAD today = **$290**, Single CAD max = **$300**

| TC# | Amount | Input ETA | ETA Color | Next | Confirm ETA | Confirm Banner |
|---|---|---|---|---|---|---|
| C-CAD-01 | $0 | No message | -- | Disabled | -- | -- |
| C-CAD-02 | $100 | Same day | Grey | Enabled | Same day | None |
| C-CAD-03 | $290 | Same day | Grey | Enabled | Same day | None |
| C-CAD-04 | $291 | 1-2 business days | Grey | Enabled | 1-2 business days | None |
| C-CAD-05 | $301 | 1-2 business days | Grey | Enabled | 1-2 business days | Blue: FX ($301 > $300 single CAD) |
| C-CAD-06 | $622 | 1-2 business days | Grey | Enabled | 1-2 business days | Blue: FX |
| C-CAD-07 | $622.01 | 2-3 business days | Grey | Enabled | 2-3 business days | Blue: FX |
| C-CAD-08 | $643 | 2-3 business days | Grey | Enabled | 2-3 business days | Blue: FX |
| C-CAD-09 | $643.01 | Exceeds $643.00 | Red | Disabled | -- | -- |
| C-CAD-10 | $1000 | Exceeds $643.00 | Red | Disabled | -- | -- |

### CASH - USD Transfer

Thresholds: Today = **$454** (combined USD), Max = **$469** (combined USD), Single USD today = **$242**, Single USD max = **$250**

| TC# | Amount | Input ETA | ETA Color | Next | Confirm ETA | Confirm Banner |
|---|---|---|---|---|---|---|
| C-USD-01 | $0 | No message | -- | Disabled | -- | -- |
| C-USD-02 | $100 | Same day | Grey | Enabled | Same day | None |
| C-USD-03 | $242 | Same day | Grey | Enabled | Same day | None |
| C-USD-04 | $243 | 1-2 business days | Grey | Enabled | 1-2 business days | None |
| C-USD-05 | $251 | 1-2 business days | Grey | Enabled | 1-2 business days | Blue: FX ($251 > $250 single USD) |
| C-USD-06 | $454 | 1-2 business days | Grey | Enabled | 1-2 business days | Blue: FX |
| C-USD-07 | $454.01 | 2-3 business days | Grey | Enabled | 2-3 business days | Blue: FX |
| C-USD-08 | $469 | 2-3 business days | Grey | Enabled | 2-3 business days | Blue: FX |
| C-USD-09 | $469.01 | Exceeds $469.00 | Red | Disabled | -- | -- |
| C-USD-10 | $1000 | Exceeds $469.00 | Red | Disabled | -- | -- |

---

## Test Cases -- MARGIN

### MARGIN - CAD Transfer

Thresholds (interest = single currency, rejection = combined):
- Avail. to Transfer without Interest = **$150** (single CAD)
- Cash Balance = **$250** (single CAD)
- Available to Transfer = **$811** (combined CAD)

#### same-day (amount <= $150)

| TC# | Amount | Input ETA | ETA Color | Next | Confirm ETA | Confirm Banner | Interest Details |
|---|---|---|---|---|---|---|---|
| M-CAD-01 | $0 | No message | -- | Disabled | -- | -- | -- |
| M-CAD-02 | $100 | Same day | Grey | Enabled | Same day | None | None |
| M-CAD-03 | $150 | Same day | Grey | Enabled | Same day | None | None |

#### choose-zero ($150 < amount <= $250) -- dialog on Next

| TC# | Amount | Input ETA | Next | Dialog? |
|---|---|---|---|---|
| M-CAD-04 | $150.01 | No message | Enabled | Yes |
| M-CAD-05 | $200 | No message | Enabled | Yes |
| M-CAD-06 | $250 | No message | Enabled | Yes |

Confirm outcomes:

| TC# | Choice | Confirm ETA | Banner | Subj. to Interest | Est. Interest/Day |
|---|---|---|---|---|---|
| M-CAD-04a | instant | Same day | Amber | $0.01 | $0.00 |
| M-CAD-04b | settlement | 2-3 business days | Green | -- | -- |
| M-CAD-05a | instant | Same day | Amber | $50.00 | $0.01 |
| M-CAD-05b | settlement | 2-3 business days | Green | -- | -- |
| M-CAD-06a | instant | Same day | Amber | $100.00 | $0.01 |
| M-CAD-06b | settlement | 2-3 business days | Green | -- | -- |

#### margin-borrow ($250 < amount <= $811) -- no dialog, interest always

| TC# | Amount | Input ETA | ETA Color | Next | Confirm ETA | Banner | Subj. to Interest | Est. Interest/Day |
|---|---|---|---|---|---|---|---|---|
| M-CAD-07 | $250.01 | Same day | Grey | Enabled | Same day | Amber | $100.01 | $0.01 |
| M-CAD-08 | $400 | Same day | Grey | Enabled | Same day | Amber | $250.00 | $0.03 |
| M-CAD-09 | $700 | Same day | Grey | Enabled | Same day | Amber | $550.00 | $0.06 |
| M-CAD-10 | $811 | Same day | Grey | Enabled | Same day | Amber | $661.00 | $0.07 |

#### rejected (amount > $811)

| TC# | Amount | Input ETA | ETA Color | Next |
|---|---|---|---|---|
| M-CAD-11 | $811.01 | Exceeds $811.00 | Red | Disabled |
| M-CAD-12 | $1000 | Exceeds $811.00 | Red | Disabled |

---

### MARGIN - USD Transfer

Thresholds (interest = single currency, rejection = combined):
- Avail. to Transfer without Interest = **$125** (single USD)
- Cash Balance = **$200** (single USD)
- Available to Transfer = **$592** (combined USD)

#### same-day (amount <= $125)

| TC# | Amount | Input ETA | ETA Color | Next | Confirm ETA | Confirm Banner | Interest Details |
|---|---|---|---|---|---|---|---|
| M-USD-01 | $0 | No message | -- | Disabled | -- | -- | -- |
| M-USD-02 | $50 | Same day | Grey | Enabled | Same day | None | None |
| M-USD-03 | $125 | Same day | Grey | Enabled | Same day | None | None |

#### choose-zero ($125 < amount <= $200) -- dialog on Next

| TC# | Amount | Input ETA | Next | Dialog? |
|---|---|---|---|---|
| M-USD-04 | $125.01 | No message | Enabled | Yes |
| M-USD-05 | $175 | No message | Enabled | Yes |
| M-USD-06 | $200 | No message | Enabled | Yes |

Confirm outcomes:

| TC# | Choice | Confirm ETA | Banner | Subj. to Interest | Est. Interest/Day |
|---|---|---|---|---|---|
| M-USD-04a | instant | Same day | Amber | $0.01 | $0.00 |
| M-USD-04b | settlement | 2-3 business days | Green | -- | -- |
| M-USD-05a | instant | Same day | Amber | $50.00 | $0.01 |
| M-USD-05b | settlement | 2-3 business days | Green | -- | -- |
| M-USD-06a | instant | Same day | Amber | $75.00 | $0.01 |
| M-USD-06b | settlement | 2-3 business days | Green | -- | -- |

#### margin-borrow ($200 < amount <= $592) -- no dialog, interest always

| TC# | Amount | Input ETA | ETA Color | Next | Confirm ETA | Banner | Subj. to Interest | Est. Interest/Day |
|---|---|---|---|---|---|---|---|---|
| M-USD-07 | $200.01 | Same day | Grey | Enabled | Same day | Amber | $75.01 | $0.01 |
| M-USD-08 | $300 | Same day | Grey | Enabled | Same day | Amber | $175.00 | $0.02 |
| M-USD-09 | $500 | Same day | Grey | Enabled | Same day | Amber | $375.00 | $0.04 |
| M-USD-10 | $592 | Same day | Grey | Enabled | Same day | Amber | $467.00 | $0.05 |

#### rejected (amount > $592)

| TC# | Amount | Input ETA | ETA Color | Next |
|---|---|---|---|---|
| M-USD-11 | $592.01 | Exceeds $592.00 | Red | Disabled |
| M-USD-12 | $1000 | Exceeds $592.00 | Red | Disabled |

---

## Test Cases -- Success Screen

| TC# | Precondition | Expected Heading | Expected Body |
|---|---|---|---|
| S-01 | Any successful transfer reaches success screen | "Your internal funds transfer is in progress" | "You can review the progress in your internal funds transfer history." |
| S-02 | Click "Done" on success screen | Returns to input screen, amount cleared, settlement choice reset | -- |

---

## Test Cases -- Dialog Behavior (Margin choose-zero only)

| TC# | Action | Expected Result |
|---|---|---|
| D-01 | Open dialog, no option selected | Continue button is disabled |
| D-02 | Select "Transfer instantly" | Continue button becomes enabled |
| D-03 | Select "Transfer on settlement day" | Continue button becomes enabled |
| D-04 | Click Cancel in dialog | Dialog closes, stays on input screen |
| D-05 | Click backdrop overlay behind dialog | Dialog closes, stays on input screen |

---

## Total Test Case Count

- TFSA CAD: 9 cases
- TFSA USD: 9 cases
- CASH CAD: 10 cases
- CASH USD: 10 cases
- MARGIN CAD: 12 input + 6 confirm sub-cases = 18
- MARGIN USD: 12 input + 6 confirm sub-cases = 18
- Success screen: 2 cases
- Dialog behavior: 5 cases

**Grand total: 81 test scenarios**
