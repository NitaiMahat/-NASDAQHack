# ExChange

Where heartbreak meets the stock market. A fictional relationship trading game with accurate accounting and questionable judgment.

## Run

Requires Node.js 22.12+ and npm. No credentials or database needed.

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
```

Open the Local URL printed by Vite, normally http://localhost:5173. Production preview: `npm run preview`.

## No database, by request

The local player and three fictional competitors are hardcoded. The single local market supplies the same prices to your player and the bots. Bots execute actual simulated trades, with separate wallets and holdings. This is not cross-device multiplayer, a room server, or an authoritative online exchange. No database, Firebase, accounts, Meta connection, or private-account monitoring has been added.

Your portfolio and round are saved in this browser under `exchange-game-v1` (the stable storage key now contains schema version 2). Version 1 saves migrate without deleting cash, holdings, trade history, or legacy stocks. Existing stock prices and cost bases are preserved. New games use the five-stock roster below; migrated games may include additional legacy stocks. Reset in Settings to start the new roster from scratch. Avoid multiple tabs sharing one save.

## The roster

| Relationship | Ticker | Initial virtual price | Risk |
| --- | --- | --- | --- |
| The Toxic Ex | TOXIC | $100 | Extreme |
| The Situationship | SITU | $75 | High |
| The One That Got Away | GONE | $120 | Medium |
| The Walking Red Flag | FLAG | $50 | Extreme |
| The Healthy Relationship | GREEN | $150 | Low |

All players start with $10,000 of fictional Emotional Capital. Buy and sell whole shares with a 0.5% fee on each side. Balances, holdings, cost basis, fees, realized and unrealized P/L, and net-worth rankings use integer cents. Fees are included in cost basis. Partial sales remove proportional rounded cost; final sales remove all remaining basis. No shorting, margin, negative balances, or real-money transactions.

## Event-driven pricing

Every price change has an event receipt. Quiet ticks do not randomly move prices. Events compound against the latest current price and round to integer cents: a +5% story like moves $100 to $105; the -15% reveal that everyone got a like moves $105 to $89.25.

Published rules in `src/engine/eventCatalog.ts`:

| Interaction | Change |
| --- | --- |
| Story like | +5% |
| Follows again / unblocks | +15% |
| I miss you | +25% |
| Heart reply | +10% |
| Left on read | -8% |
| Calls you bro | -15% |
| Unfollows | -20% |
| Posts a new partner | -30% |
| Blocks | -35% |
| Wants to get back together | +30% |

Controlled plot twists can move as far as -45%. Each event records its ID, source, timestamp, classification method, rule, previous price, settled price, and processed flag. Duplicate IDs cannot move the price twice. Prices are bounded to $0.50-$5,000. Major events (absolute impact at least 30%) have a six-market-second circuit breaker and a twelve-market-second cooldown per stock. Scheduled story reveals defer when the cooldown is active. These are legitimate settlement rules; jokes never alter execution prices.

## New rage-bait features

- **Transaction notifications:** compact, dismissible top-right queue, four-second lifetime, one visible at a time, rotating action-specific lines. Profit/loss reactions use actual event exposure or realized sale P/L. Queue capacity is six; duplicate queued messages are suppressed.
- **Delusion Meter:** a separate player statistic from stock toxicity, capped at 0-100. Buying within 45 market seconds of an I-miss-you message adds 15; buying after a block adds 25; adding to a position at least 20% below its recent peak adds 20. Profitable high-risk sales subtract 10; losing full exits subtract 15. Avoiding all trading for twelve seconds after a major negative event subtracts 5 once for that event. Conditions can combine. Each trade records its actual applied score change.
- **Final Boss:** reaching 100 persists an achievement, shows a dramatic meter state and queued achievement toast, and plays a short tone when sound is enabled. Trading remains available. Reduced motion and muted audio are respected.
- **I CAN FIX THEM:** available only for high/extreme-risk stocks at least 50% below their highest price in the last 120 market seconds. The dialog first offers peace or a recovery bet, then shows the normal one-share price plus fee. Confirmation rechecks eligibility, cash, market status, and circuit breakers. Completion adds 25 delusion points in addition to applicable normal rules. The button never moves prices or guarantees a recovery.
- **Storylines:** The Comeback, The False Hope, and The Friend Zone can be scheduled from the simulator for a selected stock. They use the same ingestion engine, price accounting, cooldowns, and receipts as manual events. One storyline per stock can be queued at a time. The first reveal follows on the next tick; no future reveal is presented as a verified external event.
- **Hall of Shame:** separate from the net-worth leaderboard. Awards use actual delusion, negative price exposure and holding duration, sales within twenty seconds before a major rally, positive realized profits, actual portfolio losses, and trade counts among active players. No qualifying evidence means no award. Bag holders rank by worst fee-inclusive holding return, then longest uninterrupted holding time. Ties use player IDs. Bots are always labeled simulated.
- **Healing era:** net worth below $1,000 triggers a closable, one-time announcement. It does not modify cash or investments. The seen flag survives refresh and rematches for this local player until browser storage is cleared. The existing optional court bailout below $2,000 remains available; it is separate from the one-time announcement.

## Ninety-second judging demo

Choose **Watch the chaos** from the intro or **Run the 90s rage demo** in the sidebar. A fresh five-market-minute round runs at 3.33x, with two-second real-time ticks. An ongoing round is accelerated from its current position; Settings offers an explicit reset for a full replay.

1. Buy TOXIC shares at $100. Five shares cost $502.50 including the fee.
2. A story like adds 5%; the next reveal takes away 15%.
3. I miss you adds 25% to the then-current price. Your holdings gain exactly the price difference times shares held.
4. The same message went to three other people: -40%.
5. A follow-up reveal, They meant their dog, subtracts another 20%: the compounded drawdown is 52%, unlocking I CAN FIX THEM.
6. Confirm a one-share purchase, inspect your Delusion Meter, and open Leaderboard for the Hall of Shame.
7. A genuine +30% reconciliation rally and final wrong-person selloff close the plot. The final bell stops trading and calculates results. Copy a text results card or rematch.

The supplied brief's -40% crash alone cannot satisfy its separate 50% drawdown condition. The extra, visibly reported -20% reveal resolves that inconsistency without falsifying the meter or price history.

## Optional server-side AI

Copy `.env.example` to `.env.local` and configure:

```env
LLM_API_KEY=your-server-only-key
LLM_BASE_URL=https://your-openai-compatible-endpoint/v1
LLM_MODEL=your-configurable-model
```

Restart Vite. `POST /api/analyze-event` takes:

```json
{"id":"unique-event-id","stockId":"toxic","type":"message","source":"simulated","text":"I miss you"}
```

The response includes a Zod-validated analysis and `method: llm | rules`. An optional `ruleId` must name a published rule. AI cannot choose prices: known events keep their published impact; unknown positive/negative/neutral-or-ambiguous classifications map to +5%/-8%/0%. Model prose is used only after validation. Missing credentials, invalid output, and timeouts fall back to deterministic rules. Server timeout is 3.5 seconds and browser API timeout is 5.5 seconds.

The dev server includes this endpoint; Vercel runs the matching serverless handler. Static production preview has no API and uses the same browser fallback. No API key is bundled into the frontend. The serverless endpoint has a best-effort, per-warm-instance request cap of twenty per IP per minute; it is not a distributed authenticated quota. This endpoint analyzes fictional text only; local trades and events still settle in the browser. Raw messages are not logged by app code. Only enter fictional messages; recent text remains in the browser until reset.

## Architecture

- `src/engine/market.ts`: canonical local state, event settlement, session ticks, scheduled stories, simulated competitors.
- `src/engine/trading.ts`: immutable integer-cent settlement, idempotency, share/cash validation and portfolio valuation.
- `src/engine/eventCatalog.ts`: published event impacts, storylines and matching.
- `src/engine/delusion.ts`: score rules, achievement levels, recent-peak drawdowns and restraint rewards.
- `src/engine/awards.ts`: evidence-based Hall of Shame calculations.
- `src/hooks/useNotifications.ts`: bounded queue and nonrepeating contextual roast rotation.
- `src/services/storage.ts`: save/load and non-destructive legacy migration.
- `src/components/`: interactive Recharts charts, orders, simulator, portfolio, delusion meter, recovery confirmation and awards.
- `server/analyze.ts` and `api/analyze-event.ts`: optional model analysis and Vercel HTTP handler.

Market history is capped at 240 samples per stock, visible event history at 100, and processed IDs are kept for the full round. Storylines and competitors are deterministic for the same ordered inputs and ticks. A synchronous local settlement ref prevents stale-state cash updates, while identical rapid clicks within 350ms are suppressed. This is single-tab consistency, not a distributed concurrency guarantee.

## Deploy and verification

Import as a Vite project in Vercel: build `npm run build`, output `dist`. The API is discovered automatically; `vercel.json` preserves API paths and rewrites frontend navigation to the SPA. Configure LLM secrets only if desired. Deployment has not been performed.

All 73 tests passed; ESLint and the TypeScript/production build passed. The running frontend returned HTTP 200, and real local API requests returned +25% for I miss you, -35% for Blocked, and -40% for the duplicate-message plot twist, all using the deterministic fallback.

Vitest covers trading math, compounding, every primary event impact, cooldowns, replay idempotency, storylines, all scoring categories, score caps, recovery eligibility and settlement, data-driven awards, v1 migration, local persistence, the announcement, rapid clicks, notification timing/rotation, and the actual rendered Recharts SVG curve. React Testing Library covers navigation and confirmation workflows.

Visual browser inspection remains unverified: the environment has no available browser session and its native Computer Use pipe was unavailable. Responsive layouts and reduced-motion rules are implemented; real-device layout still needs a visual check. Live model calls cannot be verified without credentials.
