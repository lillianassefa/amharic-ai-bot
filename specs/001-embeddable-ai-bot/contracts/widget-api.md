# API Contracts: Widget Endpoints

All endpoints in this section are public but require an `x-api-key` header.

## 1. Get Widget Configuration
`GET /api/widget/config`

Fetch the visual and behavioral settings for the widget.

### Headers
- `x-api-key`: Company's API key.

### Response (200 OK)
```json
{
  "success": true,
  "config": {
    "primaryColor": "#3B82F6",
    "welcomeMessage": "How can I help you today?",
    "welcomeMessageAm": "ዛሬ እንዴት ልረዳዎ እችላለሁ?",
    "botName": "AI Assistant",
    "botNameAm": "AI ረዳት",
    "logoUrl": "https://example.com/logo.png"
  }
}
```

---

## 2. Start/Resume Conversation
`POST /api/widget/conversations`

Starts a new conversation for a visitor or resumes an existing one.

### Headers
- `x-api-key`: Company's API key.

### Body
```json
{
  "visitorId": "unique-visitor-uuid",
  "language": "auto"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "conversationId": "cuid-string",
  "messages": [] 
}
```

---

## 3. Send Message
`POST /api/widget/conversations/:id/messages`

Sends a message from the visitor and gets an AI response.

### Headers
- `x-api-key`: Company's API key.

### Body
```json
{
  "content": "What is your shipping policy?",
  "visitorId": "unique-visitor-uuid"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "userMessage": {
    "id": "...",
    "content": "...",
    "role": "user",
    "createdAt": "..."
  },
  "aiMessage": {
    "id": "...",
    "content": "...",
    "role": "assistant",
    "createdAt": "..."
  }
}
```

