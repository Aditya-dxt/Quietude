<div align="center">

# 🌿 Quietude

### *A place for thoughts, not performance.*

**A privacy-first social network built as the antithesis of algorithmic feeds.**  
No likes. No follower counts. No red dots. No anxiety.

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-quietude--tan.vercel.app-8B7355?style=for-the-badge)](https://quietude-tan.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)

</div>

---

## 🖼️ Preview

> *(Drop a screenshot here — drag a PNG into the file on GitHub)*

![Quietude Preview](attached_assets/preview.png)

---

## 🌐 Live Demo

👉 [quietude-tan.vercel.app](https://quietude-tan.vercel.app)

**Demo accounts** (password: `quietude123`):
- `mira` · `theo` · `esme`

---

## 🧠 Philosophy

Quietude is engineered around **intentional absence**. Every missing feature is a deliberate decision — not a TODO item. These are enforced in code, not just design:

| What's missing | Why it's missing |
|---|---|
| ❌ Like / view / follower counts | Removes social comparison |
| ❌ Trending or viral scores | Removes engagement pressure |
| ❌ Notification badges & red dots | Removes anxiety triggers |
| ❌ Algorithmic sorting | Pure chronological only |
| ❌ Ad targeting or data selling | Privacy is non-negotiable |

---

## ✨ Features

### 🔐 Authentication
- Register, login, logout with **cookie-based sessions** (not JWT)
- Secure `SESSION_SECRET`-signed cookies via `cookie-parser`

### 📰 Feed
- **Home** — chronological posts from people you follow
- **Explore** — all public posts, newest first
- Zero ranking. Zero boosting. Zero manipulation.

### 📝 Posts
- Compose with a toggle: **fades in 30 days** or **permanent**
- Non-permanent posts get `expires_at` (30-day TTL)
- Background job deletes expired posts on startup and every hour

### 💬 Replies (Threaded)
- Chronological threads on each post
- Full post detail page with replies and a "Leave a thought" composer
- **No reply counts shown anywhere** — not on cards, not on detail pages

### 👤 Profiles
- Display name, bio, and posts
- Follow / unfollow — counts are **never shown**

### 💌 Direct Messages
- Private conversations between two users

### ⚙️ Settings
- Update display name and bio
- Danger zone: permanently delete account and all associated data

### 🎨 Design
- Warm paper tones — cream and beige background
- **Playfair Display** serif + **Inter** for UI
- Earthy olive and sage palette
- Generous whitespace, calm empty states

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React · Vite · Tailwind CSS · Wouter (routing) |
| **Backend** | Node.js · Express 5 |
| **Database** | PostgreSQL · Drizzle ORM |
| **Sessions** | HTTP cookies (`cookie-parser`) |
| **API** | OpenAPI spec + Orval codegen |
| **Monorepo** | pnpm workspaces |
| **Language** | TypeScript (95.6% of codebase) |

---

## 📂 Project Structure

```
Quietude/
├── artifacts/
│   ├── quietude/          # React frontend (main app)
│   ├── api-server/        # Express API server
│   └── mockup-sandbox/    # UI preview sandbox (dev only)
├── lib/
│   ├── db/                # Drizzle schema and migrations
│   ├── api-spec/          # OpenAPI source of truth (openapi.yaml)
│   ├── api-zod/           # Generated Zod validators
│   └── api-client-react/  # Generated React Query hooks
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

---

## 🗄️ Database Schema

| Table | Key Columns |
|---|---|
| `users` | id, username, display_name, bio, created_at |
| `posts` | id, author_id, content, is_permanent, expires_at, created_at |
| `replies` | id, post_id, author_id, content, created_at |
| `follows` | follower_id, following_id |
| `messages` | id, sender_id, recipient_id, content, created_at |
| `sessions` | Cookie session storage |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 24+
- [pnpm](https://pnpm.io/) 9+
- PostgreSQL database

### Environment Variables

**Backend (`artifacts/api-server/.env`):**

```env
DATABASE_URL=postgresql://user:password@host:5432/quietude
SESSION_SECRET=your-long-random-secret
PORT=5000
```

**Frontend (`artifacts/quietude/.env`):**

```env
PORT=5173
BASE_PATH=/
```

### Install & Run

```bash
# Install all workspace dependencies
pnpm install

# Push schema to your database
pnpm --filter @workspace/db run push

# Start API server
pnpm --filter @workspace/api-server run dev

# Start frontend (separate terminal)
pnpm --filter @workspace/quietude run dev
```

### Other Commands

```bash
# Typecheck entire workspace
pnpm run typecheck

# Build all packages
pnpm run build

# Regenerate API client from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen
```

---

## 📡 API Overview

All routes prefixed with `/api`.

| Group | Endpoints |
|---|---|
| **Auth** | Register · Login · Logout · Current user |
| **Posts** | Create · Feed · Explore · Single post |
| **Replies** | List and create on `/posts/:id/replies` |
| **Users** | Profiles · Follow · Unfollow |
| **Messages** | Conversations · DMs |

Full contract: [`lib/api-spec/openapi.yaml`](lib/api-spec/openapi.yaml)

---

## 🔮 Roadmap

- [ ] User search (by username/display name, no counts in results)
- [ ] Image uploads
- [ ] Export your data (privacy trust feature)
- [ ] Custom domain support

### Planned Hosting

| Component | Target |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | Railway / Supabase |

---

## 📄 License

MIT — open source and free to use.

---

<div align="center">
  Built for the quiet ones 🌿<br/>
  by <a href="https://github.com/Aditya-dxt">Aditya Dixit</a>
  ·
  <a href="https://quietude-tan.vercel.app">quietude-tan.vercel.app</a>
</div>
