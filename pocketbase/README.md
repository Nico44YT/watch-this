# PocketBase Self-Hosting Guide

This directory contains everything you need to run your own backend for WatchThis!

## Setup in 3 Steps

### 1. Download & Run PocketBase

```bash
# Download from https://pocketbase.io/docs/
./pocketbase serve
```

Open the Admin UI at `http://127.0.0.1:8090/_/` and create an admin account.

### 2. Import the Schema

In the Admin UI, go to **Settings → Import collections**, paste the contents of
[schema.json](./schema.json) and confirm the import.

This creates all required collections with the correct fields and API rules:

- `users` — extended user profiles (username, onboarding_completed)
- `friend_requests` — pending/accepted/rejected friend relationships
- `link_recommendations` — YouTube video recommendations between friends

### 3. Point the Extension at Your Instance

```bash
cp .env.example .env
# Then edit .env and set:
# VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

Then rebuild the extension:

```bash
npm run build        # Chrome
npm run build:firefox  # Firefox
```

## Google OAuth (optional)

If you want Google Sign-In to work, configure an OAuth2 provider in **Settings → Auth providers → Google** with your own Google Cloud credentials.
