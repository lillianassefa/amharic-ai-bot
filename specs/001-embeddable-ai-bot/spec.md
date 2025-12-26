# Feature Specification: Embeddable AI Chat Widget

**Feature Branch**: `001-embeddable-ai-bot`  
**Created**: 2025-12-26  
**Status**: Draft  
**Input**: User description: "let's create the embeddable ai bot that registered companies can use"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Company Admin Deploys Widget (Priority: P1)

As a company administrator, I want to obtain a simple web snippet from my dashboard so that I can embed the AI assistant on my company website and let visitors ask questions.

**Why this priority**: This is the foundational requirement for the feature to exist. Without the ability to embed and authenticate, no value is delivered.

**Independent Test**: Can be tested by copying the snippet into a simple HTML file and verifying the chat icon appears and the widget connects to the backend.

**Acceptance Scenarios**:

1. **Given** I am logged into the company dashboard, **When** I navigate to the Widget settings, **Then** I should see a copyable snippet and my active API key.
2. **Given** I have a website, **When** I paste the snippet before the closing `</body>` tag, **Then** a chat icon should appear on my website.
3. **Given** the widget is embedded, **When** I click the icon, **Then** the chat interface should open and display a welcome message.

---

### User Story 2 - Website Visitor Chats with AI (Priority: P2)

As a website visitor, I want to ask questions in the chat widget in either Amharic or English so that I can get immediate answers based on the company's documents.

**Why this priority**: This is the core interaction that provides value to the end-user.

**Independent Test**: Can be tested by interacting with the widget on a test page and verifying the AI responds correctly using document context.

**Acceptance Scenarios**:

1. **Given** I have opened the chat widget, **When** I send a message in Amharic, **Then** the AI should respond in Amharic.
2. **Given** the company has uploaded "Shipping Policy.pdf", **When** I ask "What is your shipping time?", **Then** the AI should provide an answer grounded in that document.
3. **Given** I am an anonymous visitor, **When** I refresh the page, **Then** my previous messages in that session should still be visible in the widget.

---

### User Story 3 - Admin Reviews Widget Conversations (Priority: P3)

As a company administrator, I want to see the conversations started through the website widget in my dashboard so that I can understand what my customers are asking.

**Why this priority**: Important for business intelligence and improving the document context, but the widget can function without it.

**Independent Test**: Can be tested by starting a conversation in the widget and checking if it appears in the "Conversations" section of the dashboard.

**Acceptance Scenarios**:

1. **Given** a visitor has chatted via the widget, **When** I log into the dashboard, **Then** I should see a new conversation marked as "Source: Website Widget".
2. **Given** I am reviewing a widget conversation, **When** I click on it, **Then** I should see the full message history between the visitor and the AI.

---

### Edge Cases

- **Invalid API Key**: If the widget is loaded with a revoked or invalid API key, it should display a graceful error or hide itself rather than crashing.
- **Unauthorized Domain**: If domain whitelisting is enabled and the widget is loaded from an unlisted domain, it should refuse to initialize.
- **No Documents**: If the company has no documents, the AI should fall back to general knowledge while stating it doesn't have specific company info yet.
- **Network Failure**: If the visitor loses internet connection, the widget should show a "reconnecting" status and queue messages if possible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST isolate all data created by this feature using the current session's `companyId`.
- **FR-002**: Feature MUST support both Amharic and English inputs/outputs where text interaction occurs.
- **FR-003**: System MUST prioritize grounding AI responses in relevant company document context.
- **FR-004**: Implementation MUST provide real-time updates via Socket.IO if user-facing state changes (e.g., dashboard updates when a new message arrives).
- **FR-005**: All new API endpoints MUST be documented in `docs/API.md`.
- **FR-006**: The feature MUST authenticate via API key and MUST support domain allow-listing to prevent unauthorized use of a company's API key on other websites.
- **FR-007**: The widget MUST be delivered as a single, lightweight web bundle that handles its own UI injection and API communication.
- **FR-008**: The system MUST support anonymous session tracking for widget visitors to maintain conversation state across page refreshes.
- **FR-009**: The company dashboard MUST allow administrators to customize the widget appearance (primary color, logo, and welcome message).
- **FR-010**: The system MUST implement rate limiting on the public chat endpoint to prevent abuse of the AI service.

### Key Entities *(include if feature involves data)*

- **WidgetSettings**: Configuration for a company's widget (colors, logo, welcome message, domain whitelist).
- **PublicConversation**: A conversation entity specific to the public widget, linked to a session ID rather than a registered user.
- **APIKey**: The credential used by the widget to authenticate requests.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The widget web bundle is under 150KB (gzipped) to ensure minimal impact on page load.
- **SC-002**: The widget becomes interactive (renders and shows welcome message) in under 1.5 seconds on a standard 4G connection.
- **SC-003**: 100% of conversations started via the widget are correctly isolated by `companyId` and never leaked across tenants.
- **SC-004**: Administrators can generate their widget snippet and customize its appearance in under 5 minutes from the dashboard.
- **SC-005**: The AI correctly identifies the user's language (Amharic/English) in 98% of interactions and responds accordingly.

## Assumptions

- **Web Standard Compliance**: We assume the target websites support standard web script injection and do not have restrictive Content Security Policies (CSP) that would block our widget unless the admin specifically configures it.
- **Browser Compatibility**: We assume the widget will be used on modern browsers (Chrome, Firefox, Safari, Edge) and do not explicitly target legacy browsers like IE11.
- **OpenAI Availability**: We assume the OpenAI API remains available and responsive within acceptable limits for real-time chat.

## Dependencies

- **API Key Infrastructure**: This feature depends on the existing company registration and API key generation logic in the core platform.
- **Document Extraction Service**: The widget's ability to answer questions depends on the existing PDF/DOCX extraction and storage system.
- **Vector Database/Search**: Grounding responses requires the existing RAG pipeline to be functional.
