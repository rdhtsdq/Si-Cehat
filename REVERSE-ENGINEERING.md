# Task: Reverse-Engineer Si Cehat into a Full Platform Architecture

You are working on **Si Cehat**, a prototype web-based **AI health companion for children aged 8–12**.

The existing Next.js application is primarily an MVP prototype/mockup. Your task is to thoroughly inspect the entire repository and design the architecture required to turn the prototype into a functional platform.

This task is **NOT limited to database design**.

You must reverse-engineer and propose:

1. The child-facing web application architecture
2. Backend/API architecture
3. Database architecture
4. AI/LLM architecture
5. Admin web application
6. Data collection and research/analytics architecture
7. Statistics and insight system
8. Authentication and authorization
9. Safety, privacy, and moderation architecture
10. Operational monitoring and administration

The final output should describe how these components work together as one system.

---

# 1. Product Context

Si Cehat is an educational **AI health companion for children aged 8–12**.

Children interact with Si Cehat through:

* Mascot/avatar
* Short AI companion conversations
* Adventure Map
* Daily missions
* Water tracking
* Food/habit tracking
* Physical activity tracking
* XP
* Rewards
* Progress
* Positive reinforcement

Parents receive local summaries intended to support positive family conversations.

Si Cehat is:

> An educational health companion, not a doctor, diagnostic system, or medical decision-making tool.

The project is currently:

> A prototype MVP for research.

`PRD.md` is the primary authority for:

* product behavior
* MVP scope
* research requirements
* safety requirements
* product boundaries

---

# 2. IMPORTANT: Inspect the Entire Repository First

Before proposing architecture, inspect the repository thoroughly.

Do not make architectural decisions after reading only the obvious Next.js pages.

Search throughout:

```text
*.md
*.mdx
*.tsx
*.ts
*.jsx
*.js
*.json
*.yaml
*.yml
*.env.example
```

and inspect:

```text
app/
pages/
components/
lib/
hooks/
services/
utils/
types/
data/
public/
api/
```

as applicable.

Also inspect:

* `PRD.md`
* README files
* research documentation
* design documentation
* product notes
* TODOs
* mock data
* TypeScript interfaces
* validation schemas
* API definitions
* AI prompts
* AI configuration
* state management
* authentication
* analytics
* event tracking
* parent-facing functionality
* admin-related functionality if already present

There are many Markdown files containing context.

**Search them systematically and cross-reference them.**

Do not assume `PRD.md` is the only useful documentation.

---

# 3. Source-of-Truth Hierarchy

Use this hierarchy when interpreting the repository:

### 1. PRD.md

Primary authority for:

* product scope
* intended behavior
* MVP requirements
* safety
* research objectives

### 2. Other product/research documentation

Use to clarify the PRD.

### 3. Existing implementation

Use to understand:

* current UI
* existing data structures
* interactions
* mock behavior
* technical constraints

### 4. Mock data

Use as evidence of intended data shape, but do NOT automatically treat mock data as final business logic.

If sources disagree:

1. Document the disagreement.
2. Identify the sources.
3. Prefer the PRD unless there is clear evidence it has been superseded.
4. Do not silently invent a resolution.

---

# 4. Separate Facts from Assumptions

For every major architectural decision classify it:

### OBSERVED

Explicitly implemented or documented.

### IMPLIED

Necessary to support an existing feature.

### RECOMMENDED

A reasonable architecture improvement that is not explicitly required.

### UNKNOWN

Cannot be determined from the repository.

Do not disguise assumptions as requirements.

---

# 5. First: Build a Complete Product Map

Before designing backend architecture, map the complete user experience.

Identify:

## Child Experience

Examples:

* onboarding
* avatar selection
* home/dashboard
* Adventure Map
* mission selection
* mission completion
* water tracking
* food/habit tracking
* activity tracking
* XP
* rewards
* progress
* AI companion
* profile
* settings

## Parent Experience

Identify everything related to:

* parent summary
* child progress
* activity overview
* habit overview
* achievements
* conversations if visible
* settings
* permissions/consent

## Admin Experience

If the prototype already contains admin concepts, identify them.

If it doesn't, design the required admin experience based on product requirements.

---

# 6. Target Platform Architecture

Design the overall architecture.

At minimum consider:

```text
                    ┌──────────────────────┐
                    │   Child Web App      │
                    │      Next.js         │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    Backend / API     │
                    │ Authentication       │
                    │ Business Logic       │
                    │ Data Validation      │
                    └───────┬───────┬──────┘
                            │       │
              ┌─────────────┘       └──────────────┐
              ▼                                    ▼
      ┌────────────────┐                    ┌───────────────┐
      │   PostgreSQL   │                    │   AI Layer    │
      │                │                    │ LLM / Models  │
      └────────────────┘                    └───────┬───────┘
                                                    │
                                                    ▼
                                           ┌────────────────┐
                                           │ AI Safety /    │
                                           │ Moderation     │
                                           └────────────────┘


                    ┌──────────────────────┐
                    │     Admin Portal     │
                    │       Next.js        │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Admin API / RBAC     │
                    └──────────┬───────────┘
                               │
                    ┌──────────┴───────────┐
                    ▼                      ▼
              Operational DB         Analytics/Data
                                      Warehouse
```

Do not assume this exact architecture.

Derive the final architecture from the repository.

Explain why each component exists.

---

# 7. Backend Architecture

Design the backend required to support the application.

Determine whether the existing Next.js architecture suggests:

* Next.js API routes
* Next.js server actions
* separate Node.js/Express backend
* modular monolith
* microservices
* background workers
* event-driven architecture

For an MVP, explicitly evaluate whether a **modular monolith** is sufficient before recommending microservices.

Do not introduce distributed architecture merely because diagrams look impressive.

---

# 8. Backend Modules

Identify the required backend modules.

Potential modules include:

```text
Authentication
Users
Children
Guardians
Profiles
Missions
Adventure Map
Habit Tracking
Water
Food
Activities
XP / Rewards
AI Conversations
AI Model Management
AI Safety
Notifications
Parent Summaries
Analytics
Research Data
Admin
Audit Logs
```

Do not assume every module is required.

For each module explain:

* responsibility
* main entities
* API endpoints
* business rules
* dependencies
* whether it is MVP or future

---

# 9. API Architecture

Design the backend API.

Organize endpoints by domain.

For example:

```text
/api/auth/*
/api/children/*
/api/missions/*
/api/adventure/*
/api/water/*
/api/activity/*
/api/food/*
/api/rewards/*
/api/conversations/*
/api/ai/*
/api/parent/*
/api/admin/*
/api/analytics/*
```

For each important endpoint provide:

* HTTP method
* route
* purpose
* authentication requirement
* authorization requirement
* request body
* response
* database entities involved

Example:

```text
POST /api/children/:childId/water

Auth:
Child session

Input:
{
  amountMl: number
}

Output:
{
  entryId: UUID,
  dailyTotalMl: number,
  xpEarned: number
}
```

Only create endpoints justified by the application.

---

# 10. Database Architecture

Design the PostgreSQL database.

Include:

* table
* purpose
* columns
* data types
* primary keys
* foreign keys
* indexes
* constraints
* enums
* timestamps

Separate:

### Reference / Content Data

Examples:

```text
missions
mission_types
mascots
adventure_locations
rewards
```

### User Data

Examples:

```text
children
guardians
child_guardians
```

### Behavioral Data

Examples:

```text
water_entries
activity_entries
food_entries
mission_completions
xp_transactions
```

### AI Data

Examples:

```text
conversations
messages
ai_sessions
ai_interactions
```

### Administrative Data

Examples:

```text
admin_users
roles
permissions
audit_logs
```

### Analytics Data

Examples:

```text
events
daily_metrics
aggregated_statistics
```

Do not automatically create all of these tables.

Derive them from the repository.

---

# 11. AI Architecture

This is a major component.

Design how Si Cehat interacts with AI models.

Investigate existing:

* prompts
* system messages
* AI configuration
* model references
* conversation flows
* safety instructions
* response formatting
* mock AI responses

Then design an AI abstraction layer.

The application should ideally NOT hardcode the AI provider throughout the frontend.

Consider:

```text
Child
  │
  ▼
Backend
  │
  ▼
AI Orchestrator
  │
  ├── Prompt / Persona
  ├── Context Builder
  ├── Safety Layer
  ├── Model Router
  ├── Response Validator
  └── Logging
       │
       ▼
   AI Provider
```

---

# 12. AI Model Management

The Admin Portal must be able to manage AI models.

Design the model-management system.

Potential capabilities:

* model list
* provider
* model identifier
* active/inactive
* environment
* version
* context limits
* temperature/configuration
* system prompt
* prompt version
* safety configuration
* fallback model
* usage
* token consumption
* latency
* error rate
* cost if available
* activation date
* deactivation date

Do not expose dangerous low-level configuration to administrators unless necessary.

Separate:

```text
Model Configuration
```

from:

```text
Prompt Configuration
```

and:

```text
Safety Configuration
```

where appropriate.

---

# 13. AI Model Versioning

Design how changes to AI behavior are tracked.

For example:

```text
model
model_version
prompt_version
safety_policy_version
deployment
```

An AI interaction should be traceable to the relevant configuration.

Example:

```text
Conversation Message
    ↓
Model: xyz
Model Version: 3
Prompt Version: 12
Safety Policy: 4
```

This is particularly important for research and evaluation.

---

# 14. AI Safety Architecture

Because the application is intended for children aged 8–12, design explicit safety boundaries.

Investigate and document:

* input filtering
* output moderation
* age-appropriate responses
* prohibited medical advice
* diagnosis prevention
* crisis/safety handling if required by the PRD
* prompt injection resistance
* inappropriate content handling
* escalation
* logging
* human review where required

Do not invent legal requirements.

Where legal/privacy review is necessary, explicitly label:

```text
REQUIRES LEGAL/PRIVACY REVIEW
```

---

# 15. Admin Portal

Design a separate **Admin Web Application**.

The admin portal should not simply expose the raw database.

Design it around operational tasks.

At minimum investigate these areas:

## Dashboard

Show high-level system statistics such as:

* registered users
* active users
* mission completion
* engagement
* AI usage
* data collection volume
* safety events
* system health

Only include metrics supported by the actual product requirements.

---

# 16. User Management

Admin should be able to manage users appropriately.

Potential features:

```text
User list
Search
Filter
User profile
Child/guardian relationship
Account status
Activity summary
Mission progress
Engagement
Consent state
Account creation date
Last active
```

Be extremely careful with children's data.

Admin views should follow least-privilege principles.

Avoid exposing raw sensitive data when aggregated information is sufficient.

---

# 17. AI Model Management

Admin UI should allow authorized administrators to:

```text
View models
View model versions
Activate/deactivate models
Configure model routing
Manage prompts
Version prompts
Configure safety rules
View model performance
View usage
Review errors
Rollback configuration
```

Separate permissions such as:

```text
AI Viewer
AI Operator
AI Configurator
Super Admin
```

if justified.

Do not create unnecessary roles.

---

# 18. Content / Mission Management

Determine whether administrators need to manage:

* missions
* mission categories
* Adventure Map locations
* rewards
* XP values
* mascot content
* educational content
* prompts/content used by AI

Design CRUD workflows where appropriate.

Include:

```text
Draft
Published
Archived
```

states where content lifecycle requires them.

---

# 19. Monitoring User Data

Design an admin/research interface for monitoring aggregated user behavior.

Examples:

```text
Daily active users
Weekly active users
Mission completion
Water logging frequency
Activity logging
Food/habit logging
Conversation frequency
Average session length
Retention
XP progression
Feature usage
```

Do not expose identifiable child information when aggregate statistics are sufficient.

---

# 20. Data Collection

The platform needs to gather data based on user input.

Separate:

### Product Data

Information required to operate the application.

### Research Data

Information collected to evaluate the prototype/research questions.

### Analytics Data

Information collected to understand product usage.

These should not automatically become one giant table called:

```text
everything_user_did
```

Because humanity has suffered enough database designs like that.

Define clear boundaries.

---

# 21. Event Tracking

Design an event model if justified.

Potential events:

```text
app_opened
mission_viewed
mission_started
mission_completed
water_logged
activity_logged
food_logged
reward_claimed
conversation_started
message_sent
ai_response_generated
avatar_selected
map_location_unlocked
```

Each event should potentially contain:

```text
event_id
child_id
event_type
timestamp
session_id
metadata
```

But determine which events are actually necessary.

Avoid collecting unnecessary behavioral data.

---

# 22. Statistics & Insights

Design a statistics/insight layer.

Separate:

### Raw Events

What actually happened.

### Aggregations

Examples:

```text
daily activity
weekly activity
mission completion rate
engagement
retention
```

### Insights

Higher-level interpretations generated from aggregated data.

Examples:

```text
"Mission completion increased this week."
```

If AI is used to generate insights, make this explicit.

Architecture may resemble:

```text
Raw Data
   ↓
Aggregation
   ↓
Statistics
   ↓
Insight Engine
   ↓
Admin Dashboard
```

Do not allow AI-generated insights to masquerade as medical conclusions.

---

# 23. Research Data Pipeline

Because this is an MVP intended for research, identify how research data could be extracted.

Consider:

```text
Application Database
        ↓
Research Dataset
        ↓
Anonymization / Pseudonymization
        ↓
Analysis
```

Clearly distinguish:

```text
Operational database
```

from:

```text
Research dataset
```

Do not assume researchers need direct access to production tables.

---

# 24. Admin Analytics

Design dashboard categories such as:

### User Analytics

* total users
* active users
* retention
* onboarding completion

### Engagement

* mission completion
* daily activity
* feature usage

### AI

* conversation volume
* model usage
* latency
* errors
* safety events
* token usage/cost if available

### Health Habit Tracking

Only metrics explicitly supported by the product.

Examples:

* water logging
* activity logging
* food/habit logging

### Research

* study participation
* interaction frequency
* intervention exposure
* relevant research metrics

Avoid exposing raw child information unnecessarily.

---

# 25. Roles and Permissions

Design RBAC.

Potential actors:

```text
Child
Parent / Guardian
Admin
Content Manager
Researcher
AI Operator
Super Admin
```

Do not assume every role exists.

For each role specify:

* what they can see
* what they can create
* what they can modify
* what they can delete
* what data they can access

Use least privilege.

---

# 26. Authentication Architecture

Design authentication separately for:

### Child

Consider age-appropriate authentication and avoid assuming children can use conventional adult account flows.

### Parent

Potentially stronger authentication.

### Admin

Strong authentication and elevated security.

### Researcher

Restricted access to research datasets.

Do not invent a specific authentication provider unless the repository already uses one.

---

# 27. Audit Logs

Identify administrative actions that should be auditable.

Examples:

```text
AI model changed
Prompt changed
Mission published
User account modified
Permission changed
Research export generated
Safety configuration changed
```

Define:

```text
actor
action
target
timestamp
before
after
```

where appropriate.

---

# 28. System Monitoring

Design operational monitoring separately from user analytics.

Monitor:

```text
API errors
AI errors
AI latency
Database health
Queue failures
Authentication failures
External provider failures
Background jobs
```

Do not confuse:

```text
"Children used the app 100 times"
```

with:

```text
"The backend is healthy."
```

They are different systems.

---

# 29. Data Retention

Identify categories of data and propose retention considerations:

```text
Account data
Behavioral data
AI conversations
Analytics events
Audit logs
Research data
```

Do not invent exact retention periods unless the PRD specifies them.

Instead state:

```text
Retention period: TBD / REQUIRES POLICY DECISION
```

---

# 30. Security Boundaries

Identify:

```text
Public client
Authenticated client
Backend
Database
AI provider
Admin portal
Analytics system
Research environment
```

Explain what must never happen, such as:

```text
Browser → direct database access
Browser → direct privileged AI configuration
Child → admin endpoints
Admin UI → unrestricted raw database access
```

---

# 31. Frontend Architecture

Map the existing Next.js application into frontend domains.

Identify:

```text
Child App
Parent App
Admin App
```

Determine whether these should be:

* one Next.js application
* separate applications
* separate route groups
* separate deployments

Explain the tradeoffs.

---

# 32. Recommended Repository Structure

Propose a sensible project structure.

For example:

```text
/apps
  /child-web
  /admin-web
  /api

/packages
  /shared-types
  /validation
  /ai
  /database
  /ui
```

But do not assume a monorepo is necessary.

If a simpler architecture is better for this MVP, explain why.

---

# 33. Full Data Flow

Document important flows.

## Example: Child completes mission

```text
Child UI
   ↓
POST /missions/:id/complete
   ↓
Backend validation
   ↓
Mission service
   ↓
Mission completion record
   ↓
XP transaction
   ↓
Achievement evaluation
   ↓
Updated child progress
   ↓
Response to UI
```

## Example: Child talks to AI

```text
Child
 ↓
Frontend
 ↓
Backend
 ↓
Authentication
 ↓
Safety/Input Validation
 ↓
Conversation Context
 ↓
AI Orchestrator
 ↓
Model Router
 ↓
LLM
 ↓
Output Safety Validation
 ↓
Message Storage
 ↓
Child
```

## Example: Admin changes AI model

```text
Admin
 ↓
Admin Portal
 ↓
RBAC
 ↓
Admin API
 ↓
Audit Log
 ↓
AI Configuration
 ↓
Model Deployment/Activation
```

## Example: Research insight

```text
User Events
 ↓
Event Storage
 ↓
Aggregation
 ↓
Analytics
 ↓
Insight Generation
 ↓
Admin / Research Dashboard
```

---

# 34. Produce an Architecture Diagram

Provide a Mermaid architecture diagram.

Include:

```text
Child Web
Parent Web
Admin Web
API
Authentication
Database
AI Layer
Safety Layer
Analytics
Research Data
Monitoring
```

Also provide an ERD for the database.

---

# 35. MVP vs Future Architecture

Explicitly divide the recommendation into:

## MVP

Only what is required to validate the product/research concept.

## Phase 2

Useful improvements after MVP validation.

## Future

Scaling, advanced analytics, model experimentation, integrations, etc.

Do not prematurely build:

* microservices
* complex event buses
* data warehouses
* elaborate ML pipelines
* multi-region infrastructure

unless repository evidence justifies them.

---

# 36. Final Deliverables

Your final report must contain:

## 1. Executive Summary

What Si Cehat needs architecturally.

## 2. Repository Findings

What exists today.

## 3. Product Capability Map

Child / Parent / Admin.

## 4. System Architecture

Complete platform architecture.

## 5. Backend Architecture

Modules, services, APIs.

## 6. Database Architecture

Tables, fields, relationships.

## 7. AI Architecture

Models, prompts, orchestration, safety.

## 8. Admin Portal Architecture

Pages, capabilities, permissions.

## 9. Analytics Architecture

Events, aggregation, statistics, insights.

## 10. Research Data Architecture

Operational data → research dataset.

## 11. Authentication & RBAC

Actors and permissions.

## 12. Privacy & Safety

Specific to children aged 8–12.

## 13. Monitoring & Audit

Operational monitoring and administrative auditability.

## 14. Data Flows

Major end-to-end flows.

## 15. ERD

Mermaid diagram.

## 16. System Architecture Diagram

Mermaid diagram.

## 17. API Specification

Important endpoints.

## 18. Frontend → Backend Mapping

Existing components/types → backend concepts.

## 19. Mock Data → Persistent Data

Identify everything currently hardcoded.

## 20. MVP vs Future

What should actually be built now.

## 21. Open Questions

Unknowns requiring product/research decisions.

## 22. Implementation Roadmap

Recommended implementation sequence.

---

# 37. Critical Requirement

Do not simply produce a generic "AI healthcare platform" architecture.

The architecture must be **derived from this specific repository**.

Every major component should have evidence from:

* `PRD.md`
* other Markdown documentation
* Next.js routes
* components
* TypeScript types
* mock data
* existing business logic

When something is not present, explicitly say:

```text
Not found in repository.
```

When something is inferred:

```text
Inferred.
```

When something is recommended:

```text
Recommended.
```

When something requires a product/privacy/legal decision:

```text
Decision required.
```

The goal is to transform the existing Si Cehat prototype into a **coherent, implementable platform architecture**, while keeping the MVP appropriately small and protecting the privacy and safety of its 8–12-year-old users.
