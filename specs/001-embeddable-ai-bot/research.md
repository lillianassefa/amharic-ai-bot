# Research: Embeddable AI Chat Widget

## Current State Analysis

- **Multi-tenant Architecture**: The project already uses a `companyId` for isolation across all major entities (`Document`, `Conversation`, `Workflow`).
- **Authentication**:
  - `authenticateToken` is used for the dashboard (JWT).
  - `authenticateApiKey` exists in `src/middleware/auth.ts` but is not currently wired to any routes.
  - `Company` model has a `cuid()` based `apiKey`.
- **Chat Logic**:
  - `src/routes/ai.ts` handles conversation creation, message storage, and OpenAI integration.
  - Basic RAG is implemented by fetching the first 5 documents and taking the first 1000 characters.
  - Language detection for Amharic/English is implemented.
- **Real-time**: Socket.IO is used for emitting `new-message` events, but it's currently used for the dashboard.
- **Frontend**: A React/Tailwind/Vite setup. The dashboard is the only existing UI.

## Gaps & Challenges

1. **Public Authentication**:
   - The widget needs to use the `apiKey`.
   - We need domain whitelisting to prevent unauthorized embedding.
   - We need rate limiting for public endpoints.
2. **Anonymous Session Tracking**:
   - Website visitors don't have accounts. We need a way to track their conversation session (e.g., via a generated `visitorId` or local storage).
3. **Widget Delivery**:
   - We need a way to bundle a small React/vanilla JS app into a single `.js` file that companies can embed.
   - The widget needs to be lightweight and not conflict with host website styles (Shadow DOM might be useful).
4. **Widget Configuration**:
   - We need a new table/model to store widget settings (colors, welcome message, allowed domains).
5. **CORS**:
   - The backend `corsOptions` currently only allow `CLIENT_URL` or localhost. We'll need a way to dynamically allow whitelisted domains for the widget.

## Proposed Technical Approach

### Backend
1. **Schema Update**:
   - Add `WidgetSettings` model linked to `Company`.
   - Add `isWidget` flag or `source` field to `Conversation` to distinguish dashboard vs. widget chats.
2. **New Routes**:
   - Create `src/routes/widget.ts` for all public widget interactions.
   - Endpoints:
     - `GET /api/widget/settings`: Get widget config (public, but maybe requires API key).
     - `POST /api/widget/conversations`: Start/resume a visitor conversation (API key + visitor ID).
     - `POST /api/widget/messages`: Send a message (API key + conversation ID).
3. **Auth Middleware**:
   - Enhance `authenticateApiKey` to check `Origin` header against `WidgetSettings.allowedDomains`.
4. **Rate Limiting**:
   - Use `express-rate-limit` for `/api/widget` endpoints.

### Frontend (Widget)
1. **New Package/Entrypoint**:
   - Create a separate build target in `client/` for the widget.
   - Use a minimal UI (maybe Preact or a very stripped-down React) to keep the bundle size small.
   - Shadow DOM for style isolation.
2. **Deployment**:
   - Build to `client/dist/widget.js`.
   - Serve as a static file from the backend.

### Dashboard Integration
1. **Settings Page**:
   - Add a "Widget" tab in the dashboard.
   - UI to edit colors, welcome message, and domains.
   - Display the `<script>` snippet for the user.
2. **Conversation Review**:
   - Update the "Chat" or "Conversations" list to show source (Dashboard vs. Widget).

