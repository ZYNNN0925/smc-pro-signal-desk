# SMC PRO Signal Desk

Crypto 訊號平台，包含登入保護、TradingView webhook、策略儀表板、通知機器人、交易紀錄與績效追蹤。

## Features

- Next.js App Router dashboard
- Supabase Auth login/signup/signout
- Login-protected dashboard, signals, performance, settings, trades, and admin routes
- TradingView webhook endpoint with secret validation, duplicate detection, cooldown, and event logging
- Binance Spot public market data for crypto charts and latest price
- Dashboard metrics from real Supabase signals, trades, and notification records
- Telegram / LINE notification delivery logging
- Trading journal with R-multiple, PnL, emotion, mistake tags, and notes
- Admin health checks for env vars, table counts, and recent webhook events
- Demo data fallback when env vars are not configured

## Getting Started

Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env.local` and fill the keys you want to enable.

Required for real data:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
TRADINGVIEW_WEBHOOK_SECRET=
ADMIN_EMAILS=
```

Recommended for notifications:

```bash
TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_CHAT_ID=
TELEGRAM_WEBHOOK_SECRET=
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
LINE_ADMIN_USER_ID=
```

Optional webhook cooldown:

```bash
TRADINGVIEW_WEBHOOK_COOLDOWN_MINUTES=10
```

## Supabase

Run `supabase/schema.sql` in the Supabase SQL editor.

Create users from `/login`. Add one or more emails to `ADMIN_EMAILS` so those users can access `/admin`.

The repo also has a Supabase CLI migration:

```bash
npx supabase@latest link --project-ref YOUR_PROJECT_REF --password YOUR_DB_PASSWORD
npx supabase@latest db push
```

## TradingView

Use `tradingview/smc-pro-alerts.pine`, then create an alert:

```text
Webhook URL:
https://your-domain.com/api/webhooks/tradingview

Alert condition:
Any alert() function call
```

The webhook accepts either `x-webhook-secret` header or a JSON `secret` field. Duplicate `signal_id` payloads are logged but not notified again.

## Crypto Market Data

The dashboard chart uses Binance Spot public market data:

```text
GET /api/market/candles?symbol=BTCUSDT&interval=5m&limit=180
GET /api/market/ticker?symbol=BTCUSDT
```

Market API responses use a short server-side cache to reduce Binance request pressure.

Supported symbols are configured in `src/lib/binance-market.ts`.

## Deployment

The current Vercel production URL is:

```text
https://2026-04-18-app-version-5-strategy-s.vercel.app
```

For automatic Preview deployments, connect this project folder to a GitHub repository in Vercel and push changes to branches or pull requests.

GitHub repository:

```text
https://github.com/ZYNNN0925/smc-pro-signal-desk
```
