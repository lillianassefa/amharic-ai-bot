# Implementation Plan: Embeddable AI Chat Widget

**Branch**: `001-embeddable-ai-bot` | **Date**: 2025-12-26 | **Spec**: [specs/001-embeddable-ai-bot/spec.md](spec.md)
**Input**: Feature specification from `/specs/001-embeddable-ai-bot/spec.md`

## Summary

The goal is to provide a multi-tenant, embeddable AI chat widget that allows website visitors to interact with a company's AI assistant (grounded in their uploaded documents) in Amharic and English. We will implement a new set of public-facing API endpoints protected by API keys and domain whitelisting, and a standalone lightweight web bundle (widget.js) that handles UI injection and chat state.

## Technical Context

**Language/Version**: TypeScript / Node.js 20+ / React 18+
**Primary Dependencies**: Express, Prisma, Socket.IO, OpenAI, Vite (for bundling)
**Storage**: PostgreSQL (via Prisma)
**Testing**: Manual verification using a test HTML page and automated unit tests for API key/CORS logic.
**Target Platform**: Linux server (Backend), Modern Web Browsers (Widget)
**Project Type**: Web application (React frontend + Express backend)
**Performance Goals**: Widget bundle size < 150KB (gzipped), API response for config < 200ms.
**Constraints**: Must isolate data by `companyId`, must support Amharic script correctly, must handle anonymous sessions.
**Scale/Scope**: Supports thousands of concurrent widget visitors across multiple companies.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Multi-tenant Isolation**: Every widget request will be authenticated via `apiKey` and filtered by `companyId`.
- [x] **Bilingual Support**: Uses existing Amharic/English detection and prompts.
- [x] **Document Context**: Leverages existing RAG pipeline to answer based on company documents.
- [x] **Modular Extensibility**: Widget is a standalone bundle; routes are isolated in `/api/widget`.
- [x] **Integration Surface**: Public endpoints use API keys + domain allow-listing + rate limiting.
- [x] **Real-time Feedback**: Socket.IO events for new messages will be emitted to company rooms for dashboard tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-embeddable-ai-bot/
├── plan.md              # This file
├── research.md          # Exploratory research on current auth and chat
├── data-model.md        # Prisma schema updates for WidgetSettings
├── quickstart.md        # Embedding instructions
├── contracts/           
│   └── widget-api.md    # API endpoint definitions
└── tasks.md             # (To be generated)
```

### Source Code (repository root)

```text
src/
├── routes/
│   ├── widget.ts        # New: Public widget endpoints
├── middleware/
│   ├── auth.ts          # Existing: Added domain check to authenticateApiKey
├── server.ts            # Existing: Mount /api/widget route

client/
├── src/
│   ├── widget/          # New: Standalone widget entrypoint and UI
│   ├── pages/
│   │   ├── WidgetSettings.tsx # New: Dashboard UI for widget config
```

**Structure Decision**: We will use the existing mono-repo structure. The backend will serve the widget bundle as a static file, and the frontend will include a new entrypoint for the widget build.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

