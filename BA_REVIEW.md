# Business Analyst Review: Internal Cash Transfer Prototype

## Executive Summary

This review compares `BUSINESS_LOGIC.md` with `components/transfer-view.tsx`. Several data inconsistencies, logic gaps, and UX issues were found. Below are findings and recommendations.

---

## 1. Data Consistency Review

### 1.1 Formula Verification

| Account | Formula | Expected | Actual | Status |
|---------|---------|----------|--------|--------|
| TFSA | Transfer Today = Buying Power − Unsettled | 325, 185, 578, 422 | 325, 185, 578, 422 | ✓ Consistent |
| CASH | Transfer Today = Buying Power − Unsettled | 290, 242, 622, 454 | 290, 242, 622, 454 | ✓ Consistent |
| MARGIN | Transfer Today = Buying Power − Unsettled | 300, 225, 608, 444 | 300, 225, 608, 444 | ✓ Consistent (fixed) |
| MARGIN | w/o Interest = Cash − Unsettled | 150, 125, 321, 235 | 150, 125, 321, 235 | ✓ Consistent |
| MARGIN | Cash = w/o Interest + Unsettled | 250, 200, 524, 383 | 250, 200, 524, 383 | ✓ Consistent |

### 1.2 ~~Critical Inconsistency: `marginTransferToday`~~ — RESOLVED

`marginTransferToday` has been corrected to `{ cad: 300, usd: 225, combinedCad: 608, combinedUsd: 444 }`, matching the formula **Available to Transfer Today = Buying Power − Unsettled Cash**. Values are now consistent with the business logic document.

**Remaining concern:** `marginTransferToday` is defined with correct values but is still **not used** in the margin scenario logic. See Section 2.1.

### 1.3 FX Rate Consistency

FX rate 1 USD = 1.37 CAD / 1 CAD = 0.73 USD is applied consistently across combined values. Spot checks:

- TFSA combined CAD: 350 + (200 × 1.37) = 624 ✓
- MARGIN w/o Interest combined CAD: 150 + (125 × 1.37) = 321.25 ≈ 321 ✓

---

## 2. Logic Gaps

### 2.1 `marginTransferToday` Not Used in Margin Logic

`getMarginScenario()` uses only `marginWithoutInterest` and `marginTransfer`. `marginTransferToday` is never referenced in margin scenario logic. As a result:

- There is no distinction between "settled today" vs "needs settlement" for margin.
- The concept of "Available to Transfer Today" is not used for margin, unlike TFSA/CASH.

**Impact:** If margin should mirror non-margin behavior (e.g., different ETA for amounts above Transfer Today), that behavior is missing.

### 2.2 `choose-zero` Interest Behavior Across the Full Range

The `choose-zero` range is **$321.01 – $811** (combined CAD) and **$235.01 – $592** (combined USD).

- **$321–$524 (combined CAD):** Amount ≤ total cash ($524). The excess over settled cash ($321) is unsettled. "Wait for settlement" → no interest is conceptually correct.
- **$524–$811:** Amount exceeds total cash. The client is using margin borrowing. The "Transfer on settlement day" option says "No interest charges will apply," but:
  - Settlement only affects unsettled funds.
  - The portion above cash ($524) is margin borrowing and would typically incur interest regardless of settlement.

**Conclusion:** For amounts above total cash, the "no interest" promise for "Transfer on settlement day" is **likely incorrect**. The logic treats the whole range as "unsettled vs settled," but part of the range is actually "margin borrowing."

### 2.3 Combined vs Single-Currency Threshold Mismatch

The insufficient-cash banner uses **single-currency** `marginWithoutInterest`, while scenario logic uses **combined** thresholds. This creates:

- **CAD:** $150.01–$321 → `same-day` (combined OK) but amount > $150 single CAD → amber banner.
- **USD:** $125.01–$235 → same pattern.

The message "have enough cash in the currency of the transfer" is correct in spirit, but the client may not understand why they see a warning when the combined balance is sufficient.

### 2.4 Edge Case: Amount Exactly at Boundary

For `amount === marginWithoutInterest` (e.g., $321 CAD combined), the logic returns `same-day` because `amount <= noInterest` is true. Boundary behavior is consistent.

### 2.5 Success Screen Copy

"Your transfer funds is in progress" is grammatically incorrect; it should be "Your transfer is in progress" or "Your funds transfer is in progress."

---

## 3. UX Concerns

### 3.1 choose-zero ETA Message

**Current:** "Amount exceeds your cash balance. Choose to transfer now with interest or wait for settlement."

**Issue:** "Cash balance" is ambiguous. Could be interpreted as total cash or buying power. "Settled cash" or "cash available without interest" would be clearer.

### 3.2 Dialog Warning Terminology

**Current:** "exceeds the cash amount of **$Y**"

**Issue:** "Cash amount" is vague. The value is settled cash (Available to Transfer w/o Interest). Recommended wording: "exceeds your settled cash of **$Y**" or "exceeds the amount you have in settled cash (**$Y**)."

### 3.3 Insufficient-Cash Banner

**Current:** "If you don't want to use margin, you need to have enough cash in the currency of the transfer you're placing."

**Issue:** "Use margin" is vague. A clearer version: "This transfer uses funds from multiple currencies. To avoid margin, ensure you have enough settled cash in this transfer's currency."

### 3.4 choose-zero "No Interest" Option for Large Amounts

For amounts above total cash (e.g., $700 CAD), the "Transfer on settlement day" option says "No interest charges will apply." For the portion above cash, this is likely incorrect. Clients may rely on this and be surprised by interest charges.

### 3.5 No Dialog for same-day with Margin Warning

For $150.01–$321 (CAD), the client proceeds without a dialog, but the confirm screen shows an amber margin warning. They may not realize they are using margin until the last step. Consider whether an upfront warning on the input screen would be appropriate.

---

## 4. Recommendations

### 4.1 ~~Fix `marginTransferToday` Values~~ — DONE

`marginTransferToday` has been corrected to `{ cad: 300, usd: 225, combinedCad: 608, combinedUsd: 444 }`.

### 4.2 Decide Whether `marginTransferToday` Affects Margin Logic

Deferred — kept for potential future use. Not changing margin logic at this time.

### ~~4.3 Correct choose-zero Interest Logic~~ — DONE

Split choose-zero at `marginCash`. New scenario `margin-borrow` added for amounts above cash but within buying power. "Transfer on settlement day" is only available when the amount is within total cash (choose-zero), ensuring the "no interest" promise is always accurate.

### ~~4.4 Clarify Banner and Dialog Copy~~ — DONE

All copy updated:
- choose-zero ETA: "Amount exceeds your settled cash..."
- Dialog warning: "exceeds your settled cash of $Y"
- Insufficient-cash banner: "This transfer uses funds from multiple currencies. To avoid margin, ensure you have enough settled cash in this transfer's currency."
- Success screen: "Your internal funds transfer is in progress"

### ~~4.5 Document Combined vs Single-Currency Behavior~~ — DONE

Added Section 6.8 to `BUSINESS_LOGIC.md` explaining why scenario logic uses combined thresholds while the multi-currency warning banner uses single-currency thresholds, including the specific windows where the banner appears.

---

## 5. ~~Proposed Revised Scenario Logic for Margin~~ — IMPLEMENTED (Option A)

The implemented logic:

```
IF amount <= marginWithoutInterest (combined):
    → same-day — no dialog, no interest
ELSE IF amount <= marginCash (combined):
    → choose-zero — dialog with both options (instant or settlement)
ELSE IF amount <= marginTransfer (combined):
    → margin-borrow — no dialog, interest always applies
ELSE:
    → rejected
```

---

## Summary Table

| # | Issue | Severity | Action |
|---|-------|----------|--------|
| 1 | ~~`marginTransferToday` wrong values~~ | ~~High~~ | **RESOLVED** — corrected to 300, 225, 608, 444 |
| 2 | `marginTransferToday` unused in logic | Medium | **DEFERRED** — kept for future use |
| 3 | ~~choose-zero "no interest" for amounts above cash~~ | ~~High~~ | **RESOLVED** — split at marginCash, added margin-borrow scenario |
| 4 | ~~"Transfer funds is" grammar~~ | ~~Low~~ | **RESOLVED** — changed to "Your internal funds transfer is in progress" |
| 5 | ~~"Cash amount" / "cash balance" ambiguity~~ | ~~Medium~~ | **RESOLVED** — using "settled cash" in copy |
| 6 | ~~Insufficient-cash banner clarity~~ | ~~Medium~~ | **RESOLVED** — updated to multi-currency wording |
| 7 | ~~Combined vs single-currency undocumented~~ | ~~Medium~~ | **RESOLVED** — documented in BUSINESS_LOGIC.md Section 6.8 |

---

*Review completed against `BUSINESS_LOGIC.md` and `components/transfer-view.tsx` as of 2026-03-03.*
