# 11 — Legacy Gap Analysis

**Status: waiting for input.** The pilot tenant previously evaluated "Shop ERP — Future Flow AI" (pos-saas.futureflowaiagency.com). It reportedly covers about 70% of their needs, but they didn't adopt it. That system belongs to a third party. We don't copy its code or design. We only use its **feature list** to make sure SmartZone POS covers everything the client already expects, and to record what the client disliked so we avoid it.

## How to fill this in

1. List every menu item and sub-page of the old system (from the client's walkthrough or screenshots).
2. For each, find the matching PRD story in [02-feature-spec.md](02-feature-spec.md).
3. Mark the status:
   - ✅ covered
   - ➕ covered and improved (explain how)
   - ⚠️ partially covered (add a story to 02)
   - ❌ missing (add a story to 02 and a phase in 10)
   - 🚫 deliberately excluded (state why)
4. Ask the client **why** they didn't adopt the old system, and record each reason in the second table. Every reason needs a design answer.

## Feature mapping

| Old system module / page | What it does | SmartZone POS equivalent | Status | Notes / action |
|--------------------------|--------------|--------------------------|--------|----------------|
| _e.g. Dashboard_ | | M2 DASH-01..04 | | |
| | | | | |

## Why the client rejected the old system

| # | Client's reason | Our design answer | Where in docs |
|---|-----------------|-------------------|---------------|
| 1 | | | |

## Questions to ask the client

- Which screens did you use most in the old system? Which did you never use?
- What took too long or was confusing?
- Was anything missing for mobile phones specifically (IMEI, warranty, installments, used phones)?
- How do you handle installments (কিস্তি) today? Guarantor? NID copy? Late fee?
- Do you buy used phones? How do you price and record them today?
- How many counters/computers, and what printer and scanner do you use?
- Do you plan a second branch within a year?
- Which staff roles exist and what should each be allowed to do?
- What reports does the owner check every day and every month?
- Do you need Bangla invoices, English invoices, or both?
