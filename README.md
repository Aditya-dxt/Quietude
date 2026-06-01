# Quietude

**A place for thoughts, not performance.**

Quietude is a privacy-focused social network built as the antithesis of algorithmic feeds. Every feature decision follows one rule: remove anything that creates anxiety, comparison, or performance pressure.

## Philosophy

What is intentionally **absent** (enforced in code, not just design):

- No like counts, view counts, or follower counts shown anywhere
- No trending, viral, or engagement scores
- No notification badges or red dots
- No algorithmic sorting — pure chronological everywhere
- No data selling, no ad targeting

## Features

### Authentication

- Register, login, and logout with cookie-based sessions (not JWT)
- Demo accounts: `mira`, `theo`, `esme` (password: `quietude123`)

### Feed

- **Home** — chronological feed from people you follow
- **Explore** — all public posts, newest first
- Zero ranking, zero boosting

### Posts

- Compose with a toggle: fades in 30 days **or** permanent
- Non-permanent posts get `expires_at` (30-day TTL)
- Background job deletes expired posts on startup and every hour

### Replies (threaded)

- Chronological threads on each post (`GET` / `POST` `/api/posts/:id/replies`)
- Post detail page with full post, replies below, and “Leave a thought” composer
- **No reply counts** anywhere — not on cards, not on the detail page

### Profiles

- Display name, bio, and posts
- Follow / unfollow (counts never shown)

### Direct messages

- Private conversations between users

### Settings

- Update display name and bio
- Danger zone: permanently delete account and all associated data

## Design

- Warm paper tones (cream/beige background)
- Playfair Display serif typography with Inter for UI
- Earthy olive/sage palette
- Generous whitespace and calm empty states
- No red dots, no notification badges

## Tech stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| Frontend   | React, Vite, Tailwind CSS, Wouter   |
| Backend    | Node.js, Express 5                  |
| Database   | PostgreSQL, Drizzle ORM             |
| Sessions   | HTTP cookies (`cookie-parser`)      |
| API        | OpenAPI spec + Orval codegen        |
| Monorepo   | pnpm workspaces                     |

## Project structure

```
artifacts/
  quietude/       # React frontend (main app)
  api-server/     # Express API
  mockup-sandbox/ # UI preview sandbox (dev)
lib/
  db/             # Drizzle schema and migrations
  api-spec/       # OpenAPI source of truth
  api-zod/        # Generated Zod validators
  api-client-react/ # Generated React Query hooks
```

## Database tables

- `users` — id, username, display_name, bio, created_at
- `posts` — id, author_id, content, is_permanent, expires_at, created_at
- `replies` — id, post_id, author_id, content, created_at
- `follows` — follower_id, following_id
- `messages` / direct messages
- `sessions` — cookie session storage

## Getting started

### Prerequisites

- Node.js 24+
- [pnpm](https://pnpm.io/) 9+
- PostgreSQL database

### Environment variables

| Variable         | Description                                      |
| ---------------- | ------------------------------------------------ |
| `DATABASE_URL`   | PostgreSQL connection string                     |
| `SESSION_SECRET` | Secret for signing session cookies               |
| `PORT`           | API server port (e.g. `5000`)                    |

For the frontend dev server, also set:

| Variable    | Description                          |
| ----------- | ------------------------------------ |
| `PORT`      | Vite dev server port (e.g. `5173`)   |
| `BASE_PATH` | Base URL path (e.g. `/` or `/app/`)  |

### Install and run

```bash
pnpm install

# Push schema to your database (development)
pnpm --filter @workspace/db run push

# API server
export DATABASE_URL="postgresql://..."
export SESSION_SECRET="your-secret"
export PORT=5000
pnpm --filter @workspace/api-server run dev

# Frontend (separate terminal)
export PORT=5173
export BASE_PATH=/
pnpm --filter @workspace/quietude run dev
```

### Other commands

```bash
pnpm run typecheck          # Typecheck entire workspace
pnpm run build              # Build all packages
pnpm --filter @workspace/api-spec run codegen   # Regenerate API client from OpenAPI
```

## API overview

All routes are prefixed with `/api`.

- **Auth** — register, login, logout, current user
- **Posts** — create, feed, explore, single post
- **Replies** — list and create on `/posts/:id/replies`
- **Users** — profiles, follow/unfollow
- **Messages** — conversations and DMs

See [`lib/api-spec/openapi.yaml`](lib/api-spec/openapi.yaml) for the full contract.

## Roadmap

Not yet built:

- User search (`/search` — by username/display name, no follower counts in results)
- Image uploads
- Export your data (privacy trust feature)
- Custom domain

### Planned hosting migration

| Component  | Target        |
| ---------- | ------------- |
| Frontend   | Vercel        |
| Backend    | Render        |
| Database   | Railway, Supabase, or MongoDB Atlas |

## License

MIT
