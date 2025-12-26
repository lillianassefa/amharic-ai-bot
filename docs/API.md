# API Documentation (Amharic AI Assistant)

Base URL (local): `http://localhost:3001`

All endpoints (except `/health`) are **authenticated** with a JWT:

- Header: `Authorization: Bearer <token>`

## Health

### GET `/health`

Returns basic status info.

## Auth (`/api/auth`)

### POST `/api/auth/register`

Creates a new company account.

- Body:
  - `name` (string, required)
  - `email` (string, required)
  - `password` (string, required, min 6 chars)

### POST `/api/auth/login`

Logs in an existing company account.

- Body:
  - `email` (string, required)
  - `password` (string, required)

### GET `/api/auth/profile`

Returns the current company profile for the provided token.

### POST `/api/auth/refresh-api-key`

Rotates the company’s API key (requires JWT). The UI displays the API key, but the current backend **does not expose a public API-key-authenticated chat endpoint** by default.

## Documents (`/api/documents`)

All document endpoints require JWT.

### POST `/api/documents/upload`

Uploads a document and extracts text to store in the database.

- Content-Type: `multipart/form-data`
- Form fields:
  - `document` (file, required)
  - `language` (string, optional; defaults to auto-detect)
- Allowed types: PDF, DOCX, TXT, RTF
- Default max size: 10MB (`MAX_FILE_SIZE`)

### GET `/api/documents`

Lists documents for the authenticated company.

- Query:
  - `page` (default 1)
  - `limit` (default 10)
  - `search` (optional)
  - `language` (optional; `am`, `en`, `auto`, or `all`)

### GET `/api/documents/:id`

Fetch a single document (includes extracted `content`).

### DELETE `/api/documents/:id`

Deletes the document and removes the file from `UPLOAD_PATH`.

## AI Chat (`/api/ai`)

All AI endpoints require JWT.

### POST `/api/ai/conversations`

Creates a new conversation.

- Body:
  - `title` (string, optional)
  - `language` (`auto` | `am` | `en`, optional; default `auto`)

### GET `/api/ai/conversations`

Lists conversations (paginated).

- Query:
  - `page` (default 1)
  - `limit` (default 20)

### GET `/api/ai/conversations/:id/messages`

Lists messages for a conversation (paginated).

- Query:
  - `page` (default 1)
  - `limit` (default 50)

### POST `/api/ai/conversations/:id/messages`

Sends a user message, stores it, calls OpenAI chat completion, stores assistant reply, and emits a Socket.IO event.

- Body:
  - `content` (string, required)
  - `language` (string, optional; auto-detected if omitted)

### DELETE `/api/ai/conversations/:id`

Deletes the conversation and its messages.

### POST `/api/ai/chat`

“Single-shot” chat endpoint (no conversation history stored by default).

- Body:
  - `message` (string, required)
  - `language` (string, optional)
  - `context` (string, optional)

## Workflows (`/api/workflows`)

All workflow endpoints require JWT.

### POST `/api/workflows`

Creates a workflow.

- Body:
  - `name` (string, required)
  - `description` (string, optional)
  - `config` (object, optional)
  - `webhookUrl` (string, optional; stored as `n8nWorkflowId`)

### GET `/api/workflows`

Lists workflows (includes execution count).

### PUT `/api/workflows/:id`

Updates a workflow.

- Body (all optional):
  - `name`, `description`, `config`, `isActive`, `webhookUrl`

### DELETE `/api/workflows/:id`

Deletes a workflow.

### POST `/api/workflows/:id/execute`

Executes a workflow:

- If `webhookUrl` is set, the server POSTs to that URL with `{ companyId, workflowId, executionId, input, timestamp }`.
- Otherwise executes a built-in “mock” workflow type:
  - `document-summary`
  - `language-translation`
  - `data-extraction`
  - `amharic-english-translation`

### GET `/api/workflows/:id/executions`

Lists execution history for a workflow (paginated).

## Dashboard (`/api/dashboard`)

All dashboard endpoints require JWT.

### GET `/api/dashboard/stats`

Returns counts (documents, conversations, workflows), language distribution, storage usage, and last-30-day activity.

### GET `/api/dashboard/activities`

Returns a merged “activity feed” of recent docs, conversations, and workflow executions.

- Query:
  - `limit` (default 20)

### GET `/api/dashboard/analytics`

Returns chart-friendly time series for documents, conversations, workflow trends, and language usage.

- Query:
  - `period` (days, default 30)

### GET `/api/dashboard/export`

Exports data by type.

- Query:
  - `type` (`documents` | `conversations` | `workflows`, required)
  - `format` (`json` | `csv`, default `json`; CSV supported for `documents`)

## Realtime (Socket.IO)

Server uses Socket.IO and expects clients to join a room with the company ID:

- Client event: `join-room` (payload: `companyId`)

Server emits:

- `new-message` (after chat message created)
- `document-uploaded`
- `document-deleted`
- `workflow-completed`



