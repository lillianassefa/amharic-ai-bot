# Testing Guide - Amharic AI Bot

## Project Functionalities Overview

### 1. **Authentication & Company Management**
- Company registration (name, email, password)
- Login with JWT token (7-day expiry)
- Company profile retrieval
- API key generation and rotation
- Multi-tenant isolation (each company sees only their data)

### 2. **Document Management**
- Upload documents (PDF, DOCX, TXT, RTF) up to 10MB
- Automatic text extraction from uploaded files
- Language auto-detection (Amharic vs English)
- Document search and filtering by language
- Pagination for document lists
- Document deletion (removes file + DB record)

### 3. **AI Chat**
- Create conversations with optional title/language
- Send messages in Amharic (አማርኛ) or English
- Automatic language detection
- AI responses using OpenAI GPT-4
- Document context injection (uses uploaded docs as context)
- Conversation history (last 10 messages used as context)
- Real-time updates via Socket.IO
- Single-shot chat endpoint (no conversation storage)

### 4. **Workflows**
- Create workflows with name, description, config
- Link to n8n webhooks (optional)
- Execute workflows (webhook or built-in mock types)
- Built-in workflow types:
  - `document-summary`: Summarize company documents
  - `language-translation`: Translate text
  - `data-extraction`: Extract data from documents
  - `amharic-english-translation`: Bidirectional translation
- Execution history tracking (status, input, output, errors)
- Workflow activation/deactivation

### 5. **Dashboard & Analytics**
- Overview statistics (documents, conversations, workflows, storage)
- Recent activity feed (last 30 days)
- Language distribution charts
- Workflow execution trends
- Data export (JSON/CSV)
- Storage usage tracking

### 6. **Real-time Features**
- Socket.IO integration
- Real-time notifications for:
  - New chat messages
  - Document uploads/deletions
  - Workflow completions

---

## Testing Checklist

### 🔐 Authentication & Security

#### Registration
- [ ] Register with valid data (name, email, password ≥6 chars)
- [ ] Register with duplicate email (should fail)
- [ ] Register with password < 6 chars (should fail)
- [ ] Register with missing fields (should fail)
- [ ] Verify JWT token is returned on success
- [ ] Verify API key is auto-generated

#### Login
- [ ] Login with valid credentials
- [ ] Login with invalid email (should fail)
- [ ] Login with invalid password (should fail)
- [ ] Login with missing fields (should fail)
- [ ] Verify JWT token is returned
- [ ] Test token expiry (7 days)

#### Profile & API Key
- [ ] Get profile with valid token
- [ ] Get profile with invalid/expired token (should fail)
- [ ] Refresh API key (should generate new key)
- [ ] Verify old API key no longer works

#### Security
- [ ] Test JWT authentication on protected routes
- [ ] Test without Authorization header (should fail)
- [ ] Test with malformed token (should fail)
- [ ] Verify company data isolation (Company A can't see Company B's data)

---

### 📄 Document Management

#### Upload
- [ ] Upload PDF file (should extract text)
- [ ] Upload DOCX file (should extract text)
- [ ] Upload TXT file (should extract text)
- [ ] Upload RTF file (if supported)
- [ ] Upload file > 10MB (should fail)
- [ ] Upload unsupported file type (should fail)
- [ ] Upload with explicit language (`am` or `en`)
- [ ] Upload without language (should auto-detect)
- [ ] Verify file is saved to `uploads/` directory
- [ ] Verify document record created in database
- [ ] Verify extracted text is stored

#### List & Search
- [ ] List documents (default pagination)
- [ ] List with custom page/limit
- [ ] Search by document name
- [ ] Search by content
- [ ] Filter by language (`am`, `en`, `auto`, `all`)
- [ ] Verify only company's own documents are returned

#### View & Delete
- [ ] Get single document by ID
- [ ] Get document from different company (should fail)
- [ ] Delete document (should remove file + DB record)
- [ ] Verify file is deleted from filesystem
- [ ] Verify Socket.IO event emitted on upload/delete

---

### 💬 AI Chat

#### Conversations
- [ ] Create conversation with title
- [ ] Create conversation without title (defaults to "New Conversation")
- [ ] Create conversation with language (`auto`, `am`, `en`)
- [ ] List conversations (paginated)
- [ ] Get conversation messages
- [ ] Delete conversation (should cascade delete messages)
- [ ] Verify only company's conversations are accessible

#### Messages
- [ ] Send message in English
- [ ] Send message in Amharic (አማርኛ)
- [ ] Send message with auto language detection
- [ ] Verify user message is saved
- [ ] Verify AI response is generated (requires `OPENAI_API_KEY`)
- [ ] Verify AI response is saved
- [ ] Test with uploaded documents (AI should use them as context)
- [ ] Test conversation history (last 10 messages used)
- [ ] Verify Socket.IO `new-message` event emitted
- [ ] Test single-shot chat endpoint (`/api/ai/chat`)

#### Language Detection
- [ ] Test Amharic character detection (`\u1200-\u137F`)
- [ ] Test English text detection
- [ ] Test mixed language handling

#### Error Cases
- [ ] Send message without content (should fail)
- [ ] Send message to non-existent conversation (should fail)
- [ ] Send message to another company's conversation (should fail)
- [ ] Test with invalid OpenAI API key (should handle gracefully)

---

### ⚙️ Workflows

#### CRUD Operations
- [ ] Create workflow with name only
- [ ] Create workflow with all fields (name, description, config, webhookUrl)
- [ ] List workflows
- [ ] Update workflow (name, description, config, isActive, webhookUrl)
- [ ] Delete workflow
- [ ] Verify only company's workflows are accessible

#### Execution
- [ ] Execute workflow with webhook URL (should POST to webhook)
- [ ] Execute workflow without webhook (should use built-in logic)
- [ ] Execute `document-summary` workflow
- [ ] Execute `language-translation` workflow
- [ ] Execute `data-extraction` workflow
- [ ] Execute `amharic-english-translation` workflow
- [ ] Execute inactive workflow (should fail)
- [ ] Execute non-existent workflow (should fail)
- [ ] Verify execution record created
- [ ] Verify execution status (`running`, `completed`, `failed`)
- [ ] Verify execution input/output stored
- [ ] Test webhook timeout (30 seconds)
- [ ] Test webhook failure handling
- [ ] Verify Socket.IO `workflow-completed` event emitted

#### Execution History
- [ ] List workflow executions (paginated)
- [ ] Verify execution history is accessible
- [ ] Verify execution details (status, input, output, error)

---

### 📊 Dashboard

#### Statistics
- [ ] Get dashboard stats
- [ ] Verify counts (documents, conversations, workflows)
- [ ] Verify storage usage calculation
- [ ] Verify recent activity (last 30 days)
- [ ] Verify language distribution
- [ ] Verify workflow execution stats

#### Activities
- [ ] Get recent activities
- [ ] Verify activities include documents, conversations, workflows
- [ ] Test with custom limit
- [ ] Verify activities are sorted by timestamp

#### Analytics
- [ ] Get analytics for default period (30 days)
- [ ] Get analytics for custom period
- [ ] Verify daily document uploads data
- [ ] Verify daily conversations data
- [ ] Verify workflow execution trends
- [ ] Verify language usage statistics

#### Export
- [ ] Export documents as JSON
- [ ] Export documents as CSV
- [ ] Export conversations as JSON
- [ ] Export workflows as JSON
- [ ] Test invalid export type (should fail)
- [ ] Verify exported data is correct

---

### 🔌 Real-time (Socket.IO)

#### Connection
- [ ] Connect to Socket.IO server
- [ ] Join company room with `join-room` event
- [ ] Verify connection established
- [ ] Test disconnection handling

#### Events
- [ ] Receive `new-message` event after sending chat message
- [ ] Receive `document-uploaded` event after upload
- [ ] Receive `document-deleted` event after deletion
- [ ] Receive `workflow-completed` event after workflow execution
- [ ] Verify events contain correct data
- [ ] Verify events are scoped to company (room-based)

---

### 🗄️ Database & Data Integrity

#### Multi-tenancy
- [ ] Verify Company A cannot access Company B's documents
- [ ] Verify Company A cannot access Company B's conversations
- [ ] Verify Company A cannot access Company B's workflows
- [ ] Test cascade deletes (delete company → deletes all related data)

#### Data Validation
- [ ] Test required field validation
- [ ] Test email uniqueness constraint
- [ ] Test password hashing (bcrypt)
- [ ] Test file size limits
- [ ] Test file type validation

---

### 🚀 Performance & Edge Cases

#### Performance
- [ ] Test with large document uploads (near 10MB limit)
- [ ] Test pagination with many documents/conversations
- [ ] Test concurrent requests
- [ ] Test database query performance

#### Edge Cases
- [ ] Upload empty file
- [ ] Upload corrupted PDF/DOCX
- [ ] Send very long chat message
- [ ] Create conversation with very long title
- [ ] Test with special characters in filenames
- [ ] Test with Unicode/Amharic characters in content
- [ ] Test pagination boundaries (page 0, negative, very large)

#### Error Handling
- [ ] Test 404 for non-existent resources
- [ ] Test 401 for unauthorized access
- [ ] Test 400 for invalid input
- [ ] Test 500 error handling (server errors)
- [ ] Verify error messages are user-friendly

---

### 🌐 API Integration

#### OpenAI
- [ ] Verify OpenAI API key is configured
- [ ] Test chat completion with valid key
- [ ] Test error handling with invalid key
- [ ] Test rate limiting handling
- [ ] Verify model used (`gpt-4`)
- [ ] Verify temperature and max_tokens settings

#### n8n Webhooks (if used)
- [ ] Test webhook URL format
- [ ] Test webhook POST payload
- [ ] Test webhook response handling
- [ ] Test webhook timeout

---

### 🖥️ Frontend Testing

#### Pages
- [ ] Login page loads and works
- [ ] Register page loads and works
- [ ] Dashboard displays stats correctly
- [ ] Documents page lists/uploads files
- [ ] Chat page sends/receives messages
- [ ] Workflows page displays workflows

#### UI/UX
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Loading states display correctly
- [ ] Error messages display correctly
- [ ] Form validation works
- [ ] Navigation between pages works
- [ ] Logout functionality works

#### Real-time Updates
- [ ] Verify Socket.IO client connects
- [ ] Verify real-time updates appear in UI
- [ ] Test reconnection handling

---

### 🔧 Configuration & Environment

#### Environment Variables
- [ ] Verify `DATABASE_URL` is set
- [ ] Verify `JWT_SECRET` is set
- [ ] Verify `OPENAI_API_KEY` is set
- [ ] Test with missing required env vars
- [ ] Verify `PORT` defaults to 3001
- [ ] Verify `CLIENT_URL` for CORS
- [ ] Verify `UPLOAD_PATH` defaults correctly
- [ ] Verify `MAX_FILE_SIZE` defaults to 10MB

#### Database
- [ ] Verify Prisma migrations run successfully
- [ ] Verify Prisma client generates correctly
- [ ] Test database connection
- [ ] Test database schema matches Prisma schema

---

## Quick Test Script

### Manual Testing Flow

1. **Setup**
   ```bash
   npm run install:all
   cp env.example .env
   # Edit .env with your values
   npx prisma generate
   npx prisma migrate dev
   ```

2. **Start Services**
   ```bash
   npm run dev
   ```

3. **Test Authentication**
   - Register a new company
   - Login
   - Get profile
   - Refresh API key

4. **Test Documents**
   - Upload a PDF
   - Upload a DOCX
   - List documents
   - Search documents
   - Delete a document

5. **Test Chat**
   - Create conversation
   - Send message in English
   - Send message in Amharic
   - Verify AI responds
   - Check conversation history

6. **Test Workflows**
   - Create a workflow
   - Execute it
   - Check execution history

7. **Test Dashboard**
   - View stats
   - View activities
   - Export data

---

## Automated Testing Recommendations

Consider adding:
- **Unit tests**: Business logic, utilities, helpers
- **Integration tests**: API endpoints, database operations
- **E2E tests**: Full user flows (Playwright/Cypress)
- **Load tests**: Performance under load (k6, Artillery)

---

## Known Issues to Watch

1. **API Key Auth**: UI shows API key, but no public API-key-authenticated endpoint exists yet
2. **Workflows UI**: Frontend workflows page is mostly placeholder
3. **Error Messages**: Some error messages may need improvement
4. **File Cleanup**: Ensure uploaded files are cleaned up on errors

