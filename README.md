# NASDAQ

**National Association of Situationship, Delusion And Questionable Decisions.** A fictional relationship exchange where incoming messages move the market. Formerly branded ExChange; existing saves are preserved.

## Run

Requires Node.js 22.12+ and npm. No database or third-party credentials are needed. The guest demo does not require an account.

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
```

Open http://localhost:5180 (the login branch pins this port and fails if it is occupied). Sign up/log in, or choose **Try the guest demo**. Direct guest entry: http://localhost:5180/?demo=1. Production preview uses http://localhost:5181; without a running auth API it offers the guest fallback.

## No database, by request

The signed-in local player (or guest) trades against three fictional competitors. The single local market supplies the same prices to your player and the bots. Bots execute actual simulated trades, with separate wallets and holdings. This is not cross-device multiplayer, a room server, or an authoritative online exchange. No database, Firebase, Meta connection, or private-account monitoring has been added. Mock accounts use the local JSON-file store described below.

Your portfolio and round are saved in this browser under `exchange-game-v1:<account id>` for signed-in users or `exchange-game-v1` for guests (schema version 2). The first account to log in on a browser inherits a pre-login guest save, preserving holdings, money, Chaos/Judge mode, seed, and narrative state. Other accounts have separate save slots. Version 1 saves migrate without deleting cash, holdings, trade history, or legacy stocks. Existing stock prices and cost bases are preserved. New games use the five-stock roster below; migrated games may include additional legacy stocks. Reset in Settings to start the new roster from scratch. Avoid multiple tabs sharing one save.

## Compatible signup and login

Merged from `feature/login-integration` while keeping NASDAQ branding, the automatic inbox, both message modes, presenter controls, and the current trading engine.

- `login.html` and `public/auth/` contain the signup/login interface, password feedback and bounded fictional notifications, restyled for NASDAQ.
- `server/auth.ts` implements signup, login, logout and session lookup; the same handler serves Vite and `api/auth/[action].ts` on Vercel.
- Account records use salted PBKDF2-SHA256 hashes in git-ignored `data/accounts.json`. HMAC-signed HttpOnly, SameSite=Lax session cookies last seven days. The generated signing secret is stored beside accounts unless `AUTH_SECRET` is set. Failed login attempts are limited per email and warm server instance.
- `AUTH_DATA_FILE` optionally selects the mock account file. No SQL/Firestore database was introduced. Do not commit account files or use real personal passwords for this prototype.
- A valid login opens the dashboard directly with the trader alias. Existing custom display names and saved portfolios remain intact. Logout is available in the sidebar and profile settings; failed logout requests show an error instead of pretending to clear the session.
- `AuthGate` validates the current account before rendering it. An anonymous session goes to login. An unavailable API offers retry or an explicit guest demo rather than a redirect loop. `/?demo=1` runs the demo with no server account requirement.
- Port 5180 is the local development default; 5181 is static preview. Both are strict. CLI `--port` can select another port for isolated testing.

On Vercel, the default account file is in `/tmp`: it is ephemeral and not shared across server instances. Configuring a stable signing secret does not make that account file durable. This is a local/mock login integration, not production authentication or shared portfolio persistence. The guest demo remains usable on static hosting. Login/session UI does not make browser-controlled game balances server-authoritative.

The production build emits both `dist/index.html` and `dist/login.html`. Hosting routes check actual files before the SPA fallback, preserving the login page, public assets, and API functions.

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

## Automatic simulated inbox

The player does not need to enter messages. Open the market, buy a stock, and fictional Instagram-style DMs and activity updates arrive automatically. A persistent inbox sits beside the chart on wide screens and stacks below it on smaller screens. The **DM inbox** page contains the full recent feed. Incoming notifications are dismissible and expire after six seconds; they never take focus or halt trading.

Every event displays the sender or activity source, message, stock, percentage movement, before/after price, and the actual effect on the shares held at delivery. That exposure is captured in the event receipt, so selling later does not rewrite history. Older saves without an exposure snapshot explicitly say it was not recorded. Plot twists come from **The group chat**, rather than falsely depicting those revelations as direct messages from an ex.

Two modes are available before a round starts:

- **Judge demo:** fixed ninety-second narrative, with no presenter typing required. Fresh games default to this mode at 3.33x speed.
- **Chaos:** a five-minute game with seeded random stock selection, coherent storyline selection, and varied arrival times. A new Chaos round receives a browser-generated seed; saving preserves it for reproducible continuation. Low-risk GREEN gets the positive Green Flag storyline. Other stocks get mixed-signal narratives. Events within each storyline remain ordered, and all price moves still use published rules.

The feed pauses and resumes with the market. Mode changes lock once time advances or an event arrives; explicitly reset the round before switching. No future-message spoilers appear in the player inbox.

Manual inputs and optional staged storylines are collapsed under **Presenter controls** on the DM inbox page. The presenter panel also provides pause/resume, speed, reset, and end-round controls. These tools are local presentation controls, not authenticated host permissions. Manual submissions are labeled presenter events; automatic events remain simulated. No live Instagram connection is claimed.

## Ninety-second judging demo

1. Enter a display name, choose **Enter the market**, and leave **Judge demo** selected. Open the market and buy five TOXIC shares for $502.50 including fees.
2. About six seconds later, a simulated 3 AM story view arrives: +5%. Five shares gain $25 in value; net session P/L also accounts for the $2.50 purchase fee.
3. Further automatic reveals mirror the pitch: still no text reply (-12%), haha (+8%), and I call everyone babe (-25%).
4. I miss you (+25%) sparks another rally, then the duplicate-message reveal crashes the current price by 40%.
5. The follow-up dog reveal subtracts 20% more. The compounded drawdown crosses 50%, unlocking **I CAN FIX THEM** on TOXIC.
6. Complete the normal one-share confirmation, inspect the Delusion Meter, and open Leaderboard for the Hall of Shame.
7. A +30% reconciliation rally and final wrong-person selloff finish the plot. The final bell stops trading and shows results.

Nine controlled reveals occur at market times 20, 40, 60, 80, 110, 150, 180, 220, and 260 seconds, on the first tick at or after the threshold. The final bell is at 300 market seconds, or about ninety real seconds at the default demo speed. **Watch judge demo** on the landing page or **Run the 90s judge demo** in the sidebar starts the sequence directly. An ongoing Judge round continues from its existing position; it is not silently reset.

The -40% crash alone cannot satisfy the separate 50% recovery-button threshold. The visible -20% follow-up resolves this without falsifying price history.

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

The dev server includes this endpoint; Vercel runs the matching serverless handler. Automatic feed events use the deterministic published-rule classifier locally; optional model requests occur only for presenter-submitted messages. Static production preview has no API and uses the same browser fallback. No API key is bundled into the frontend. The serverless endpoint has a best-effort, per-warm-instance request cap of twenty per IP per minute; it is not a distributed authenticated quota. This endpoint analyzes fictional text only; local trades and events still settle in the browser. Raw messages are not logged by app code. Only enter fictional messages; recent text remains in the browser until reset.

## Architecture

- `src/engine/market.ts`: canonical local state, event settlement, session ticks, scheduled stories, simulated competitors.
- `src/engine/trading.ts`: immutable integer-cent settlement, idempotency, share/cash validation and portfolio valuation.
- `src/engine/eventCatalog.ts`: published event impacts, pitch-specific stories and matching.
- `src/components/IncomingFeed.tsx`, `IncomingAlert.tsx`, and `FeedControls.tsx`: automatic inbox, incoming notifications and mode selection.
- `src/services/messagePresentation.ts`: separates direct messages, activity updates and group-chat plot twists.
- `src/engine/delusion.ts`: score rules, achievement levels, recent-peak drawdowns and restraint rewards.
- `src/engine/awards.ts`: evidence-based Hall of Shame calculations.
- `src/hooks/useNotifications.ts`: bounded queue and nonrepeating contextual roast rotation.
- `src/services/storage.ts`: save/load and non-destructive legacy migration.
- `src/components/`: interactive Recharts charts, orders, simulator, portfolio, delusion meter, recovery confirmation and awards.
- `server/analyze.ts` and `api/analyze-event.ts`: optional model analysis and Vercel HTTP handler.

Market history is capped at 240 samples per stock, visible event history at 100, and processed IDs are kept for the full round. Storylines and competitors are deterministic for the same ordered inputs and ticks. A synchronous local settlement ref prevents stale-state cash updates, while identical rapid clicks within 350ms are suppressed. This is single-tab consistency, not a distributed concurrency guarantee.

## Deploy and verification

Import as a Vite project in Vercel: build `npm run build`, output `dist`. The API is discovered automatically; `vercel.json` preserves API paths and rewrites frontend navigation to the SPA. Configure LLM secrets only if desired; optional auth configuration is documented above. The file-first routes preserve the built login page and its assets. Deployment has not been performed.

All 108 tests passed; ESLint and the TypeScript/production build passed. Real local HTTP checks verified the branded login page/assets, account signup, duplicate rejection, wrong-password rejection, login, cookie-based session lookup, logout cookie clearing, and the +25% message-analysis fallback.

Vitest covers trading math, compounding, every primary event impact, cooldowns, replay idempotency, storylines, all scoring categories, score caps, recovery eligibility and settlement, data-driven awards, v1 migration, local persistence, the announcement, rapid clicks, notification timing/rotation, and the actual rendered Recharts SVG curve. React Testing Library covers navigation and confirmation workflows.

Visual browser inspection remains unverified: the environment has no available browser session and its native Computer Use pipe was unavailable. Responsive layouts and reduced-motion rules are implemented; real-device layout still needs a visual check. Live model calls cannot be verified without credentials.
