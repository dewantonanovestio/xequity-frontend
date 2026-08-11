# Task 03: Mock Fixtures

**Status:** pending
**HLD Reference:** Technical Implementation > File Structure (mocks section)

## Description

Create JSON fixture files for end-users, symbols, portfolio holdings, and P&L data. These feed the mockBaseQuery system and allow the user dashboard to function without backend endpoints.

## Acceptance Criteria

- [ ] `lib/mocks/endUsers.json` contains 3-4 end-users with endUserId, clientId, externalId, walletId, displayName
- [ ] `lib/mocks/symbols.json` contains 5-8 tradable symbols (AAPL, MSFT, GOOGL, TSLA, AMZN, etc.)
- [ ] `lib/mocks/portfolio.json` contains holdings keyed by endUserId (max 5 symbols per user)
- [ ] `lib/mocks/pnl.json` contains P&L entries keyed by endUserId with realized + unrealized values
- [ ] All JSON files parse without errors
- [ ] End-user clientIds are consistent with existing order fixtures where possible
- [ ] Holding symbols match those in symbols.json

## Dependencies

- **Depends on:** Task 02 (types defined)
- **Blocks:** Task 04 (mock handlers)

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `lib/mocks/endUsers.json` | Create | Mock end-user list |
| `lib/mocks/symbols.json` | Create | Mock tradable symbols |
| `lib/mocks/portfolio.json` | Create | Mock holdings per end-user |
| `lib/mocks/pnl.json` | Create | Mock P&L per end-user |

## Unit Tests

N/A -- JSON fixtures validated by mock handler tests in Task 04.

## Implementation Hints

- **Pattern to follow:** Existing fixtures at `lib/mocks/orders.json`, `lib/mocks/ledger.json`
- **Key considerations:**
  - `endUsers.json` must include `walletId` per user (resolved from a wallet linked to their clientId)
  - Portfolio `avgCost` should be realistic (e.g., AAPL at ~150, TSLA at ~250)
  - P&L entries should have a mix of positive and negative values
  - Keep mock data small but representative

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-08-04 | Initial task created |
