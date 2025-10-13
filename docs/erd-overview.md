# Database ERD Overview - Portfolio Grade

## High-Level System Architecture

```mermaid
erDiagram
    Organization ||--o{ Membership : "has many"
    Organization ||--o{ Post : "owns"
    Organization ||--o{ Tag : "owns"
    Organization ||--o{ Form : "owns"
    Organization ||--o{ AuditLog : "tracks"

    User ||--o{ Membership : "belongs to"
    User ||--o{ Post : "authors"
    User ||--o{ Comment : "writes"
    User ||--o{ AuditLog : "performs"

    Post ||--o{ PostTag : "tagged with"
    Post ||--o{ Comment : "has"
    Post ||--o{ Revision : "versioned"
    Post ||--o{ FileAsset : "attached to"

    Tag ||--o{ PostTag : "applied to"

    Form ||--o{ Field : "contains"
    Form ||--o{ Submission : "receives"

    Submission ||--o{ FileAsset : "attached to"

    Outbox ||--o{ IdempotencyKey : "processed with"

    Organization {
        string id PK
        string name
        datetime createdAt
        datetime updatedAt
    }

    User {
        string id PK
        string email UK
        string password
        string name
        datetime createdAt
        datetime updatedAt
    }

    Membership {
        string id PK
        enum role
        string organizationId FK
        string userId FK
    }

    Post {
        string id PK
        string organizationId FK
        string authorId FK
        string title
        string content
        int version
        datetime createdAt
        datetime updatedAt
    }

    Tag {
        string id PK
        string organizationId FK
        string name
    }

    Comment {
        string id PK
        string postId FK
        string authorId FK
        string content
        datetime deletedAt
        datetime createdAt
        datetime updatedAt
    }

    Form {
        string id PK
        string organizationId FK
        string name
        json schema
        datetime createdAt
        datetime updatedAt
    }

    Submission {
        string id PK
        string formId FK
        json data
        datetime createdAt
    }

    FileAsset {
        string id PK
        string url
        string mimeType
        string postId FK
        string submissionId FK
        datetime createdAt
    }

    AuditLog {
        string id PK
        string organizationId FK
        string userId FK
        string action
        string resource
        string resourceId
        datetime at
    }

    Outbox {
        string id PK
        string topic
        json payload
        string status
        int attempts
        datetime createdAt
        datetime updatedAt
    }

    IdempotencyKey {
        string id PK
        string orgId
        string route
        string key
        string bodyHash
        json response
        datetime createdAt
    }

    TagAggregate {
        string id PK
        string organizationId FK
        string tagId FK
        int count
        datetime calculatedAt
    }
```

## Multi-Tenant Architecture

```mermaid
erDiagram
    Organization ||--o{ Membership : "manages users"
    Organization ||--o{ Post : "owns content"
    Organization ||--o{ Tag : "defines tags"
    Organization ||--o{ Form : "creates forms"
    Organization ||--o{ AuditLog : "tracks activity"

    Membership {
        enum role "OrgAdmin|Editor|Viewer"
        string organizationId FK
        string userId FK
    }

    Organization {
        string id PK "Multi-tenant boundary"
        string name
    }
```

## Content Management System

```mermaid
erDiagram
    Post ||--o{ PostTag : "many-to-many"
    Post ||--o{ Comment : "one-to-many"
    Post ||--o{ Revision : "versioning"
    Post ||--o{ FileAsset : "attachments"

    Tag ||--o{ PostTag : "many-to-many"

    Post {
        string id PK
        string organizationId FK "Tenant isolation"
        string authorId FK
        string title
        string content
        int version "Optimistic locking"
        datetime createdAt
        datetime updatedAt
    }

    Tag {
        string id PK
        string organizationId FK "Tenant isolation"
        string name "Unique per org"
    }

    Comment {
        string id PK
        string postId FK
        string authorId FK
        string content
        datetime deletedAt "Soft delete"
        datetime createdAt
        datetime updatedAt
    }

    Revision {
        string id PK
        string postId FK
        int version "Unique per post"
        string content
        datetime createdAt
    }
```

## Form Builder System

```mermaid
erDiagram
    Form ||--o{ Field : "contains fields"
    Form ||--o{ Submission : "receives submissions"

    Field ||--o{ Submission : "field data in submissions"

    Form {
        string id PK
        string organizationId FK "Tenant isolation"
        string name
        json schema "Form definition"
        datetime createdAt
        datetime updatedAt
    }

    Field {
        string id PK
        string formId FK
        string label
        string type "input|textarea|select|checkbox"
        json config "Field configuration"
        int order "Display order"
    }

    Submission {
        string id PK
        string formId FK
        json data "Field values"
        datetime createdAt
    }
```

## Audit & Event System

```mermaid
erDiagram
    AuditLog {
        string id PK
        string organizationId FK "Tenant isolation"
        string userId FK "Who performed action"
        string action "CREATE|UPDATE|DELETE"
        string resource "Post|Comment|Form"
        string resourceId "Resource identifier"
        datetime at "When action occurred"
    }

    Outbox {
        string id PK
        string topic "Event topic"
        json payload "Event data"
        string status "pending|processing|done|error"
        int attempts "Retry count"
        datetime createdAt
        datetime updatedAt
    }

    IdempotencyKey {
        string id PK
        string orgId "Tenant isolation"
        string route "API endpoint"
        string key "Idempotency key"
        string bodyHash "Request hash"
        json response "Cached response"
        datetime createdAt
    }
```

## Key Design Patterns

### 1. Multi-Tenancy

- Every entity (except system tables) includes `organizationId`
- Tenant isolation enforced at database level
- Unique constraints scoped to organization

### 2. RBAC (Role-Based Access Control)

- Three-tier role system: OrgAdmin > Editor > Viewer
- Membership table manages user-organization relationships
- Role hierarchy enforced in application logic

### 3. Soft Deletes

- Comments use `deletedAt` for soft deletion
- Allows restoration of accidentally deleted content
- Maintains referential integrity

### 4. Optimistic Locking

- Posts have `version` field for conflict resolution
- Prevents concurrent modification issues
- Enables collaborative editing

### 5. Polymorphic Relationships

- FileAsset can be attached to Posts or Submissions
- Flexible file attachment system
- Single table for all file types

### 6. Event Sourcing

- Outbox pattern for reliable event publishing
- Idempotency keys prevent duplicate operations
- Audit trail for all system actions

### 7. Background Processing

- TagAggregate for materialized views
- BullMQ integration for async processing
- Performance optimization through aggregation
