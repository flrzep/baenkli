# Bänkli – Next.js 14 + Supabase + Tailwind + Shadcn/UI

Find and rate benches around you. Built with Next.js 14 App Router, Supabase (Auth + Postgres + Storage), Tailwind CSS, and Shadcn-style UI components.

## Tech Stack

- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS (PostCSS + autoprefixer)
- Supabase (Auth, Database, Storage)
- Shadcn-style components (Button, Input, Label)
- OpenStreetMap via react-leaflet

## Features

- Email/password auth (sign up, login)
- Protected dashboard for authenticated users
- Profiles with avatar upload (Supabase Storage)
- Benches map with markers from DB
- Create benches with image upload and optional rating details

## Getting Started

### 1) Install dependencies

```bash
pnpm i
# or
npm i
```

### 2) Create and configure Supabase

1. Create a new Supabase project.
2. Create two Storage buckets:
   - `avatars` (public)
   - `benches` (public)
3. Create the database schema (SQL below).
4. Enable Row Level Security (RLS) and apply policies (SQL below).
5. Get your project URL and anon key from Project Settings → API.

### 3) Environment variables

Create a `.env.local` file in the project root with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SUPABASE_BUCKET_AVATARS=avatars
NEXT_PUBLIC_SUPABASE_BUCKET_BENCHES=benches
```

Note: If your environment blocks creating `.env.example` via tooling, copy the above into your own `.env.example` manually.

### 4) Run locally

```bash
npm run dev
# http://localhost:3000
```

### 5) Deploy to Vercel

1. Push this repo to GitHub/GitLab.
2. Import to Vercel.
3. Add the same environment variables in Vercel Project Settings.
4. Deploy. (No extra config required.)

## SQL: Schema + Policies

Run in Supabase SQL Editor.

```sql
-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "Users can insert their profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their profile" on public.profiles
  for update using (auth.uid() = id);

-- benches
create table if not exists public.benches (
  id uuid primary key default gen_random_uuid(),
  name text,
  location jsonb, -- { lat: number, lng: number }
  rating numeric, -- optional aggregate rating
  image text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

alter table public.benches enable row level security;

create policy "Benches are viewable by everyone" on public.benches
  for select using (true);

create policy "Authenticated can insert benches" on public.benches
  for insert with check (auth.role() = 'authenticated');

create policy "Owners can update their benches" on public.benches
  for update using (auth.uid() = created_by);

-- bench_ratings
create table if not exists public.bench_ratings (
  id uuid primary key default gen_random_uuid(),
  bench_id uuid not null references public.benches(id) on delete cascade,
  profile_id uuid not null references auth.users(id) on delete cascade,
  rating_location numeric,
  rating_comfort numeric,
  material text,
  created_at timestamp with time zone default now()
);

alter table public.bench_ratings enable row level security;

create policy "Ratings viewable by everyone" on public.bench_ratings
  for select using (true);

create policy "Authenticated can rate" on public.bench_ratings
  for insert with check (auth.role() = 'authenticated' and auth.uid() = profile_id);
```

## Project Structure

```
app/
  (auth)/
    login/
    signup/
  dashboard/
  globals.css
  layout.tsx
  page.tsx
components/
  avatar-uploader.tsx
  bench-form.tsx
  map.tsx
  navbar.tsx
  ui/
    button.tsx
    input.tsx
    label.tsx
lib/
  supabaseClient.ts
  types.ts
  utils.ts
```

## Notes

- The map uses OpenStreetMap via `react-leaflet`. Markers are based on `benches.location` JSON `{ lat, lng }`.
- Auth and DB access use Supabase SSR/Browser clients. Dashboard route redirects server-side if no session.
- Storage buckets `avatars` and `benches` are used for avatar and bench images respectively.


