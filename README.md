# 🏋️ Gym Tracker

A personal workout tracker. Pick **Lower** (legs + core), **Upper**, or **Full body** and the app feeds you exercises one at a time — varying muscle groups, balancing exercises across sessions, and suggesting progressive-overload targets based on what you achieved last time. Log 3 sets per exercise, hit **Stop** when you're done, and watch your progress in graphs.

Built with React + Vite (deployable on Vercel) and Supabase (auth + Postgres storage), so your data syncs between phone and desktop.

## Features

- **Smart exercise picker** — never the same muscle group twice in a row, prefers exercises you've done least recently/often, never repeats an exercise within a session.
- **Progressive overload suggestions** — hit your rep target on all 3 sets and the next session suggests +2.5 kg (or +1 rep / +5 s for bodyweight and timed moves).
- **Previous achievement + all-time best** shown for every exercise.
- **90 s rest timer** with vibration on phones.
- **Progress charts** per exercise (top weight and reps over time).
- **Workout history** with full set details.

## Setup (one-time, ~10 minutes)

### 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, paste and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
3. In **Authentication → Users**, click **Add user → Create new user** and set your email + password (this is your login; there is no public sign-up).
4. In **Project Settings → API**, copy the **Project URL** and the **anon public** key.

### 2. Vercel

1. Import this repo into [Vercel](https://vercel.com) (framework preset: **Vite**).
2. In **Settings → Environment Variables**, add:
   - `VITE_SUPABASE_URL` — your project URL
   - `VITE_SUPABASE_ANON_KEY` — your anon key
3. Deploy. Open the URL on your phone and desktop, and sign in with the user you created.

> Tip: on your phone, use the browser's **Add to Home Screen** so it opens full-screen like an app.

### Local development

```bash
cp .env.example .env   # fill in your Supabase values
npm install
npm run dev
```

## How suggestions work

Each exercise has a per-set rep target (e.g. squat 8, calf raise 12). If your **last** session hit the target on **all three sets**, the suggestion adds weight (+2.5 kg for big lifts, +1.25 kg for isolation moves). Otherwise it repeats the last weight. Box jumps progress by +1 rep, side planks by +5 s.

## Customising exercises

Exercise list, muscle groups, rep targets, and weight increments all live in [`src/lib/exercises.ts`](src/lib/exercises.ts) — edit and redeploy.
