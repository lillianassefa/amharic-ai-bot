<!--
  Sync Impact Report
  - Version change: 1.0.0 -> 1.1.0
  - Modified principles:
    - IV. Modular Extensibility -> IV. Modular Extensibility (expanded to cover workflows + widget)
  - Added sections:
    - Product Roadmap & Flexibility
    - Data Privacy & Retention
  - Templates requiring updates:
    - ✅ .specify/templates/plan-template.md (updated Constitution Check gates)
    - ✅ .specify/templates/spec-template.md (updated default FRs for integrations/workflows)
    - ✅ .specify/templates/tasks-template.md (updated foundational tasks for widget/workflow extensibility)
  - Follow-up TODOs:
    - Consider domain allow-listing + rate limiting for widget API keys before production rollout
-->

# Amharic AI Bot Constitution

## Core Principles

### I. Multi-tenant Isolation
Strict data separation by `companyId`. Every database query and server action MUST filter by the company identifier derived from the authenticated session (JWT or API Key). Rationale: Essential for SaaS security, compliance, and multi-tenant trust.

### II. Bilingual Support (Amharic/English)
Seamless language detection and proper script handling for both Amharic (አማርኛ) and English. AI responses MUST use correct script, grammar, and tone for the target language. Rationale: Core value proposition for regional accessibility and business relevance.

### III. Document-Context Grounding (RAG)
Prioritize company-specific knowledge from uploaded documents. AI responses MUST be accurate and grounded in provided context to minimize hallucinations and maximize utility. Rationale: Ensures responses are tailored to specific business data.

### IV. Modular Extensibility
Design features (workflows, integrations, embeddable widget) as independent, isolated components with stable contracts. Shared logic MUST live in documented middleware or common utilities, and new capabilities MUST be addable without rewriting core auth, storage, or chat flows. Rationale: Enables rapid evolution (new workflow types and new integration surfaces) without fragile coupling.

### V. Real-time Feedback
Utilize Socket.IO for immediate updates on critical events including messages, file uploads, and workflow completions. The dashboard MUST reflect server state without page refreshes. Rationale: Provides a modern, responsive user experience for professional environments.

## Security & API Strategy

- JWT authentication for internal dashboard sessions.
- API Key authentication for external integrations (including the embeddable chat widget).
- External (widget) endpoints MUST authenticate by API key and MUST enforce tenant isolation by `companyId`.
- API keys SHOULD be protected with domain allow-listing and rate limiting before production rollout.
- CORS policy: permissive in development to facilitate testing; strict origin enforcement in production.

## Engineering Standards

- Strict TypeScript typing enforced across both backend and frontend for end-to-end type safety.
- Prisma ORM used for reliable database schema management and type-safe query building.
- API documentation maintenance in `docs/API.md` is mandatory for all endpoint changes or additions.
- Database models MUST include `companyId` and appropriate foreign key constraints for all tenant-specific data.

## Product Roadmap & Flexibility

- The system MUST support two interaction surfaces:
  - **Company dashboard** (authenticated): manage documents, workflows, analytics, and review conversations.
  - **Embeddable website widget** (public): a small JavaScript snippet that injects a bottom-right icon and chat UI on the company’s website.
- Workflows are a first-class extensibility mechanism: companies MUST be able to add new workflow types over time (built-in and/or webhook-based) without requiring new deployments for each customer.
- The public widget MUST route conversations into the correct company space (via API key), and the company MUST be able to review those conversations inside the dashboard.

## Data Privacy & Retention

- Only store data required for product functionality (conversations, messages, uploaded documents, workflow executions).
- Treat all customer data as confidential; tenant isolation is non-negotiable.
- A retention policy SHOULD be added (per-company configuration) before production; default retention SHOULD be documented.

## Governance

- The Constitution supersedes all other local development practices and prior undocumented conventions.
- Amendments require explicit documentation, a semantic version increment, and propagation across `.specify` templates.
- All code reviews and architectural decisions MUST verify compliance with company data isolation principles.
- Versioning policy: MAJOR for principle removals/redefinitions; MINOR for new principles or material expansions; PATCH for clarifications and refinements.

**Version**: 1.1.0 | **Ratified**: 2025-12-26 | **Last Amended**: 2025-12-26
