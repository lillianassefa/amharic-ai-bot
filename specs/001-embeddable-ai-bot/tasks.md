# Tasks: Embeddable AI Chat Widget

**Input**: Design documents from `/specs/001-embeddable-ai-bot/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create `src/routes/widget.ts` placeholder file for public endpoints
- [X] T002 [P] Create `client/src/widget/` directory for standalone widget frontend
- [X] T003 [P] Create `client/src/pages/WidgetSettings.tsx` placeholder for dashboard config UI

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Add `WidgetSettings` model and update `Conversation` model in `prisma/schema.prisma`
- [X] T005 Run prisma migration `npx prisma migrate dev --name add_widget_settings`
- [X] T006 [P] Update `authenticateApiKey` middleware in `src/middleware/auth.ts` to support domain allow-listing
- [X] T007 [P] Configure `express-rate-limit` for public endpoints in `src/server.ts`
- [X] T008 [P] Update `src/server.ts` to mount `/api/widget` routes and serve static widget bundle from `client/dist/widget.js`
- [X] T009 [P] Update `docs/API.md` with planned widget endpoint signatures from `contracts/widget-api.md`
- [X] T010 Verify `authenticateApiKey` correctly rejects invalid origins via manual curl check

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Company Admin Deploys Widget (Priority: P1) 🎯 MVP

**Goal**: Allow admins to configure their widget and get the embed snippet from the dashboard.

**Independent Test**: Admin can save widget colors/welcome message and copy a script tag that includes their API key.

### Implementation for User Story 1

- [X] T011 [US1] Implement `GET /api/widget/config` in `src/routes/widget.ts` using `authenticateApiKey`
- [X] T012 [P] [US1] Create `PUT /api/dashboard/widget-settings` in `src/routes/dashboard.ts` (requires JWT auth)
- [X] T013 [US1] Build `WidgetSettings.tsx` UI in `client/src/pages/WidgetSettings.tsx` to manage colors and domains
- [X] T014 [P] [US1] Implement snippet generation logic in `client/src/pages/WidgetSettings.tsx` showing the `<script>` tag
- [X] T015 [US1] Add "Widget Settings" link to the dashboard navigation in `client/src/components/Layout.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Website Visitor Chats with AI (Priority: P2)

**Goal**: Visitors can chat with the AI in Amharic/English on an external site.

**Independent Test**: Embed widget in a local `test.html`, send an Amharic message, and receive an Amharic AI response grounded in documents.

### Implementation for User Story 2

- [X] T016 [US2] Implement `POST /api/widget/conversations` in `src/routes/widget.ts` to start anonymous sessions
- [X] T017 [US2] Implement `POST /api/widget/conversations/:id/messages` in `src/routes/widget.ts` using existing AI service logic
- [X] T018 [US2] Create minimal React/Preact entry point in `client/src/widget/index.tsx` for the chat UI
- [X] T019 [P] [US2] Implement chat UI components (bubble, window, input) in `client/src/widget/components/`
- [X] T020 [US2] Add Shadow DOM wrapper to `client/src/widget/index.tsx` to prevent style leakage
- [X] T021 [US2] Configure Vite build in `client/vite.config.ts` to output a single `widget.js` bundle
- [X] T022 [US2] Implement session persistence in `client/src/widget/services/api.ts` using `localStorage` for `visitorId`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Admin Reviews Widget Conversations (Priority: P3)

**Goal**: Dashboard allows admins to distinguish and review chats from the widget.

**Independent Test**: Dashboard conversation list shows a "Widget" badge next to chats started via the public widget.

### Implementation for User Story 3

- [X] T023 [US3] Update conversation fetching logic in `src/routes/dashboard.ts` to include the `source` field
- [X] T024 [P] [US3] Update `Dashboard.tsx` in `client/src/pages/` to display "Widget" vs "Dashboard" source
- [X] T025 [US3] Add filtering by source (Dashboard/Widget) to the activity list UI

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T026 [P] Finalize `docs/API.md` with all widget endpoint details
- [X] T027 Code cleanup and ensure consistent error handling across `/api/widget`
- [X] T028 Performance check: Ensure `widget.js` bundle size is under 150KB gzipped
- [X] T029 [P] Add unit tests for `detectLanguage` and `authenticateApiKey` in `src/tests/`
- [X] T030 Run `specs/001-embeddable-ai-bot/quickstart.md` validation on a clean environment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 (Snippet/Dashboard Settings) is the MVP priority
  - US2 (Chat Widget implementation) follows US1
  - US3 (Review) is the final feature enhancement

### Parallel Opportunities

- T006, T007, T008, T009 (Foundational infrastructure) can run in parallel.
- T012 and T014 (Dashboard API vs Dashboard UI logic) can run in parallel.
- T019 and T020 (Widget UI components vs Widget mounting) can run in parallel.

---

## Parallel Example: User Story 2

```bash
# Launch widget UI components and Mounting logic together:
Task: "Implement chat UI components (bubble, window, input) in client/src/widget/components/"
Task: "Add Shadow DOM wrapper to client/src/widget/index.tsx to prevent style leakage"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1 (Snippet generation)
4. **STOP and VALIDATE**: Test that an admin can get their snippet and API key.

### Incremental Delivery

1. Foundation ready (Phase 2 complete)
2. Admin settings ready (Phase 3 complete) -> **Deployment 1**
3. Chat Widget ready (Phase 4 complete) -> **Deployment 2 (Full MVP)**
4. Review Dashboard ready (Phase 5 complete) -> **Final Feature Set**

