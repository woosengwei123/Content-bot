# ContentBot Pro — Setup Guide

A multi-client content generation platform for marketing agencies and IT brands. Each workspace (your agency account) can hold multiple clients, generate AI content for each, and track a variety score per piece.

## What's inside

- **Auth & accounts** — Supabase email/password auth. Signing up creates a workspace automatically.
- **Multi-client workspace** — each workspace can hold clients (limited by plan: free = 1, pro = 5, agency = 25).
- **AI content generation** — `/api/generate` calls Claude server-side to write content tailored to each client's industry/audience/voice, then scores it across 7 dimensions (hook, clarity, CTA, emotion, authority, virality, variety) and predicts reach (Low/Medium/High/Viral).
- **Dashboard** — client switcher, score ring, stat cards, content feed — matches the simple design you approved.
- **Database** — Postgres via Supabase, with row-level security so every workspace only ever sees its own data.

## 1. Create a Supabase project (free)

1. Go to [supabase.com](https://supabase.com) and create a free account + new project.
2. Once it's created, go to **Project Settings → API**. Copy:
   - `Project URL`
   - `anon public` key
3. Go to the **SQL Editor**, paste the entire contents of `supabase/schema.sql` from this project, and run it. This creates all tables, security policies, and the trigger that auto-creates a workspace when someone signs up.

## 2. Get an Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com), create an account, and generate an API key.
2. This key is used **only server-side** inside `/api/generate` — it is never sent to the browser, so it's safe from being stolen by users.

## 3. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in the three values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

## 4. Install and run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`, click **Get started**, and create your first workspace.

## 5. Deploy (so you can actually sell this)

The easiest path is [Vercel](https://vercel.com) (made by the Next.js team, free tier available):

1. Push this project to a GitHub repo.
2. Go to vercel.com → New Project → import the repo.
3. Add the same 3 environment variables in Vercel's project settings.
4. Deploy. You'll get a live URL you can put behind your own domain.

## Plan limits (already wired into the code)

| Plan   | Clients | Generations/month* |
|--------|---------|---------------------|
| free   | 1       | 10                  |
| pro    | 5       | 150                 |
| agency | 25      | 1000                |

*Generation limits are defined in `src/lib/types/index.ts` but not yet enforced in the API — only client limits are enforced right now. Let me know if you want generation-count enforcement added too.

Billing itself (charging cards, upgrading/downgrading plans) is **not yet wired up** — the `workspaces.plan` column exists and the limits respect it, but you'd need to connect Stripe (or similar) to actually let people pay and have their plan field update automatically. That's a natural next step once you're ready to charge people.

## What to build next, roughly in order of value

1. **Stripe billing** — checkout + webhook to update `workspaces.plan` on payment.
2. **Edit / delete content pieces** and a proper content detail view.
3. **Scheduling** — the `scheduled_for` column already exists on `content_pieces`, just needs a calendar UI.
4. **Team invites** — invite teammates into your workspace (the `profiles.role` field already supports `owner`/`member`).
5. **White-label** — custom logo/colors per workspace, if you want to resell this to other agencies.

## A security note

While building this, I found that the project folder initially contained files with a prompt-injection attempt embedded inside fake "documentation" — instructions trying to get an AI coding assistant to use a non-existent API and introduce broken code. I deleted that entire folder and rebuilt everything from scratch using verified, real APIs. Worth keeping in mind generally: be cautious with any AI-assisted coding template you didn't create yourself, especially ones with files like `AGENTS.md` or `CLAUDE.md` instructing the AI to read something before acting.
