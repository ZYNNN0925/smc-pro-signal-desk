# SMC PRO Signal Desk Execution Plan

## Phase 1 Login MVP

1. Run the local app and confirm the dashboard loads.
2. Create a Supabase project and run `supabase/schema.sql`.
3. Copy `.env.example` to `.env.local`.
4. Fill `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `TRADINGVIEW_WEBHOOK_SECRET`.
5. Add your admin email to `ADMIN_EMAILS`.
6. Sign up through `/login`, then verify the account in Supabase Auth.
7. Add `tradingview/smc-pro-alerts.pine` to TradingView.
8. Create a TradingView alert with webhook URL `/api/webhooks/tradingview`.
9. Test with one symbol and one timeframe before inviting users.

### CLI Schema Push

This repo is initialized for Supabase CLI and includes the initial migration at:

```text
supabase/migrations/20260418000000_initial_schema.sql
```

After logging in to the CLI or setting `SUPABASE_ACCESS_TOKEN`, push the schema with:

```bash
npx supabase@latest link --project-ref YOUR_PROJECT_REF --password YOUR_DB_PASSWORD
npx supabase@latest db push
```

Or push with a direct database URL:

```bash
npx supabase@latest db push --db-url "postgresql://postgres:YOUR_DB_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres"
```

## Phase 2 Notifications

1. Create Telegram Bot and set `TELEGRAM_BOT_TOKEN`.
2. Create LINE Messaging API channel and set channel secret/access token.
3. Users bind Telegram chat ID or LINE user ID in `/settings`.
4. Signals fan out to enabled notification channels.

## Phase 3 Trading Journal

1. Add member trade creation form.
2. Connect each trade to a signal when possible.
3. Add personal stats: win rate, average R, drawdown, mistake tags.
4. Add exchange import only after manual journal flow is stable.
