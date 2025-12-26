# amharic-ai-bot

An **Amharic + English AI assistant** for businesses, with:

- **Company accounts** (multi-tenant) with JWT auth
- **Document upload + text extraction** (PDF/DOCX/TXT/RTF) stored per company
- **AI chat** that can use uploaded documents as context
- **Workflows** (built-in “mock” workflows + optional n8n webhook execution)
- **Dashboard analytics**
- **Real-time events** via Socket.IO

## What this project is about

This repo is a full-stack app intended to help a business offer an AI assistant that can converse in **Amharic (አማርኛ)** and **English**, optionally grounded on the business’s uploaded documents. Each business (“company”) has isolated data: conversations/messages, documents, and workflows.

## Tech stack

- **Backend**: Node.js + Express + TypeScript + Prisma + PostgreSQL
- **AI**: OpenAI Chat Completions
- **Frontend**: React + TypeScript + Vite + Tailwind
- **Realtime**: Socket.IO
- **Uploads**: Multer (+ `pdf-parse`, `mammoth`)

## Local development

### Prerequisites

- Node.js 18+ (recommended)
- PostgreSQL 13+

### 1) Install dependencies

```bash
cd /home/lillian/Documents/projects/amharic-ai-bot
npm run install:all
```

### 2) Configure environment

This repo stores templates as `env.example` and `client/env.example` (some environments ignore `.env.example`).

- Copy server env:

```bash
cp env.example .env
```

- Copy client env:

```bash
cp client/env.example client/.env.local
```

Now edit `.env` and set at least:

- `DATABASE_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY`

### 3) Set up the database

```bash
npx prisma generate
npx prisma migrate dev
```

### 4) Run the app

```bash
npm run dev
```

- Backend: `http://localhost:3001`
- Frontend (Vite): `http://localhost:5173`

## Production build

```bash
npm run build
npm run start
```

The server serves the built frontend from `client/dist` when `NODE_ENV=production`.

## API documentation

See `docs/API.md`.

## Notes / current limitations

- **Public API key integration**: the UI shows `company.apiKey`, but the current backend endpoints are protected with **JWT** by default. (There is an API-key auth middleware in `src/middleware/auth.ts`, but it is not currently wired to a public chat route.)
- **Workflows UI**: the `/workflows` page is currently mostly UI/placeholder; the backend workflow APIs exist in `/api/workflows`.
