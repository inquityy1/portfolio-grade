# System Architecture & Database Integration

## High-Level System Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        Admin[Admin App<br/>React + Vite<br/>Port 4200]
        Portal[Portal App<br/>React + Vite<br/>Port 4201]
    end

    subgraph "API Layer"
        API[NestJS API<br/>Port 3000]
        Auth[JWT Authentication]
        RBAC[Role-Based Access Control]
        Tenant[Multi-Tenant Guard]
    end

    subgraph "Business Logic"
        Posts[Post Management]
        Forms[Form Builder]
        Comments[Comment System]
        Files[File Management]
        Audit[Audit Logging]
    end

    subgraph "Infrastructure"
        Redis[(Redis<br/>Cache & Queue)]
        BullMQ[Background Jobs]
        Outbox[Event Processing]
    end

    subgraph "Database Layer"
        PostgreSQL[(PostgreSQL<br/>Port 5432)]

        subgraph "Core Tables"
            Org[Organizations]
            Users[Users]
            Memberships[Memberships]
        end

        subgraph "Content Tables"
            PostsTable[Posts]
            Tags[Tags]
            PostTags[PostTags]
            Comments[Comments]
            Revisions[Revisions]
        end

        subgraph "Form Tables"
            Forms[Forms]
            Fields[Fields]
            Submissions[Submissions]
        end

        subgraph "System Tables"
            Files[FileAssets]
            AuditLogs[AuditLogs]
            OutboxTable[Outbox]
            Idempotency[IdempotencyKeys]
            TagAgg[TagAggregates]
        end
    end

    %% Frontend to API
    Admin --> API
    Portal --> API

    %% API to Business Logic
    API --> Auth
    API --> RBAC
    API --> Tenant
    API --> Posts
    API --> Forms
    API --> Comments
    API --> Files
    API --> Audit

    %% Business Logic to Infrastructure
    Posts --> Redis
    Forms --> Redis
    Comments --> Redis
    Audit --> Outbox

    %% Infrastructure to Database
    Redis --> PostgreSQL
    BullMQ --> PostgreSQL
    Outbox --> PostgreSQL

    %% API to Database
    API --> PostgreSQL

    %% Database Relationships
    Org --> Memberships
    Users --> Memberships
    Org --> PostsTable
    Users --> PostsTable
    PostsTable --> PostTags
    Tags --> PostTags
    PostsTable --> Comments
    Users --> Comments
    PostsTable --> Revisions
    Org --> Forms
    Forms --> Fields
    Forms --> Submissions
    PostsTable --> Files
    Submissions --> Files
    Org --> AuditLogs
    Users --> AuditLogs
    Org --> TagAgg
    Tags --> TagAgg
```

## Database Schema Relationships

```mermaid
erDiagram
    %% Multi-Tenant Core
    Organization ||--o{ Membership : "1:N"
    Organization ||--o{ Post : "1:N"
    Organization ||--o{ Tag : "1:N"
    Organization ||--o{ Form : "1:N"
    Organization ||--o{ AuditLog : "1:N"
    Organization ||--o{ TagAggregate : "1:N"

    User ||--o{ Membership : "1:N"
    User ||--o{ Post : "1:N"
    User ||--o{ Comment : "1:N"
    User ||--o{ AuditLog : "1:N"

    %% Content Relationships
    Post ||--o{ PostTag : "1:N"
    Post ||--o{ Comment : "1:N"
    Post ||--o{ Revision : "1:N"
    Post ||--o{ FileAsset : "1:N"

    Tag ||--o{ PostTag : "1:N"
    Tag ||--o{ TagAggregate : "1:N"

    %% Form Relationships
    Form ||--o{ Field : "1:N"
    Form ||--o{ Submission : "1:N"

    Submission ||--o{ FileAsset : "1:N"

    %% System Tables
    Outbox ||--o{ IdempotencyKey : "1:N"

    %% Entity Definitions
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
        enum role "OrgAdmin|Editor|Viewer"
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

    PostTag {
        string postId FK
        string tagId FK
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

    Revision {
        string id PK
        string postId FK
        int version
        string content
        datetime createdAt
    }

    Form {
        string id PK
        string organizationId FK
        string name
        json schema
        datetime createdAt
        datetime updatedAt
    }

    Field {
        string id PK
        string formId FK
        string label
        string type
        json config
        int order
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

## Data Access Patterns

### 1. Multi-Tenant Queries

```sql
-- All queries include organization filter
SELECT * FROM posts WHERE organizationId = ? AND ...
SELECT * FROM tags WHERE organizationId = ? AND ...
SELECT * FROM forms WHERE organizationId = ? AND ...
```

### 2. RBAC Authorization

```sql
-- Check user membership and role
SELECT m.role FROM memberships m
WHERE m.userId = ? AND m.organizationId = ?
```

### 3. Content Relationships

```sql
-- Get post with tags and comments
SELECT p.*, t.name as tag_name, c.content as comment_content
FROM posts p
LEFT JOIN post_tags pt ON p.id = pt.postId
LEFT JOIN tags t ON pt.tagId = t.id
LEFT JOIN comments c ON p.id = c.postId
WHERE p.organizationId = ? AND c.deletedAt IS NULL
```

### 4. Form Submissions

```sql
-- Get form with fields and submissions
SELECT f.*, fi.label, fi.type, s.data, s.createdAt
FROM forms f
LEFT JOIN fields fi ON f.id = fi.formId
LEFT JOIN submissions s ON f.id = s.formId
WHERE f.organizationId = ?
ORDER BY fi.order, s.createdAt DESC
```

## Performance Optimization

### Index Strategy

- **Tenant Indexes**: All tables have `(organizationId, ...)` composite indexes
- **Time-based Indexes**: `createdAt`, `updatedAt` for pagination
- **Foreign Key Indexes**: All FK columns indexed for joins
- **Unique Constraints**: Prevent data integrity issues

### Caching Strategy

- **Redis**: Session storage, rate limiting, temporary data
- **Application Cache**: Frequently accessed data (user roles, org settings)
- **Materialized Views**: TagAggregate for analytics

### Background Processing

- **BullMQ**: Async operations (file processing, notifications)
- **Outbox Pattern**: Reliable event delivery
- **Retry Logic**: Exponential backoff for failed operations
