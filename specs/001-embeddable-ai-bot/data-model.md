# Data Model: Embeddable AI Chat Widget

## Schema Changes

We will add a `WidgetSettings` model to store customization and security configurations for each company's widget.

```prisma
// prisma/schema.prisma

model WidgetSettings {
  id             String   @id @default(cuid())
  companyId      String   @unique
  primaryColor   String   @default("#3B82F6") // Default blue-500
  welcomeMessage String   @default("How can I help you today?")
  welcomeMessageAm String @default("ዛሬ እንዴት ልረዳዎ እችላለሁ?")
  botName        String   @default("AI Assistant")
  botNameAm      String   @default("AI ረዳት")
  logoUrl        String?
  allowedDomains String[] @default([]) // Array of domains for CORS/Security
  isEnabled      Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  company        Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@map("widget_settings")
}

// Update Company model to include WidgetSettings
model Company {
  // ... existing fields ...
  widgetSettings WidgetSettings?
}

// Update Conversation model to track source
model Conversation {
  // ... existing fields ...
  source    String   @default("dashboard") // "dashboard" or "widget"
  visitorId String?  // To track anonymous visitors across sessions
}
```

## Migration Plan

1.  Add `WidgetSettings` model to `prisma/schema.prisma`.
2.  Add `source` and `visitorId` to `Conversation` model.
3.  Run `npx prisma migrate dev --name add_widget_settings`.
4.  Optionally, a script to initialize `WidgetSettings` for existing companies with default values.

