# Portfolio Grade - Database ERD Documentation

## Overview

This document provides comprehensive Entity Relationship Diagrams (ERDs) for the Portfolio Grade application, a multi-tenant content management system built with NestJS, React, and PostgreSQL.

## 📁 Documentation Structure

- **[ERD Overview](erd-overview.md)** - High-level system relationships and design patterns
- **[Detailed ERD](erd-detailed.md)** - Complete technical specifications with indexes and constraints
- **[System Architecture](system-architecture.md)** - Database integration patterns and performance considerations

## 🏗️ Architecture Highlights

### Multi-Tenant Design

- **Tenant Isolation**: Every entity (except system tables) includes `organizationId`
- **Data Security**: Tenant boundaries enforced at database level
- **Scalability**: Supports unlimited organizations with isolated data

### Role-Based Access Control (RBAC)

- **Three-Tier System**: OrgAdmin > Editor > Viewer
- **Flexible Permissions**: Role hierarchy with granular access control
- **Membership Management**: Users can belong to multiple organizations with different roles

### Content Management

- **Posts & Tags**: Many-to-many relationship with organization scoping
- **Comments**: Soft delete functionality with restoration capabilities
- **Versioning**: Post revisions with optimistic locking
- **File Attachments**: Polymorphic relationships for flexible file management

### Form Builder System

- **Dynamic Forms**: JSON schema-based form definitions
- **Field Management**: Configurable field types with ordering
- **Submissions**: Structured data storage with file attachments

### Event Processing

- **Audit Trail**: Complete activity logging for compliance
- **Outbox Pattern**: Reliable event publishing for distributed systems
- **Idempotency**: Prevents duplicate operations in distributed environments

## 🔧 Technical Implementation

### Database Features

- **Primary Keys**: CUID-based globally unique identifiers
- **Foreign Keys**: Proper referential integrity with cascade/set null policies
- **Indexes**: Optimized for multi-tenant queries and performance
- **Constraints**: Unique constraints scoped to organizations

### Performance Optimizations

- **Composite Indexes**: Tenant-scoped queries with time-based sorting
- **Caching Strategy**: Redis integration for session and data caching
- **Background Processing**: BullMQ for async operations
- **Materialized Views**: TagAggregate for analytics

### Data Patterns

- **Soft Deletes**: Comments use `deletedAt` for restoration
- **Optimistic Locking**: Posts use `version` field for conflict resolution
- **Polymorphic Relationships**: FileAsset supports multiple entity types
- **Event Sourcing**: Complete audit trail with outbox processing

## 🚀 Getting Started

### Generate ERDs

```bash
# Install ERD generator
npm install -g prisma-erd-generator

# Generate ERDs in multiple formats
npm run erd:generate
```

### View ERDs

- **Mermaid**: View in any Mermaid-compatible viewer (GitHub, GitLab, etc.)
- **SVG**: Embed in documentation or view in browser
- **PNG**: Use in presentations or printed documentation

## 📊 Schema Statistics

- **Total Tables**: 15 entities
- **Relationships**: 25+ foreign key relationships
- **Indexes**: 15+ performance-optimized indexes
- **Constraints**: 8 unique constraints
- **Multi-Tenant**: 12 tenant-scoped tables

## 🔍 Key Relationships

### Core Entities

- `Organization` → `Membership` → `User` (RBAC)
- `Organization` → `Post` → `Comment` (Content)
- `Organization` → `Form` → `Submission` (Forms)

### Content Management

- `Post` ↔ `Tag` (Many-to-many via PostTag)
- `Post` → `Revision` (Versioning)
- `Post` → `FileAsset` (Attachments)

### System Tables

- `AuditLog` (Activity tracking)
- `Outbox` (Event processing)
- `IdempotencyKey` (Duplicate prevention)
- `TagAggregate` (Analytics)

## 🛡️ Security Features

- **Tenant Isolation**: Complete data separation between organizations
- **Role-Based Access**: Granular permissions based on user roles
- **Audit Logging**: Complete activity trail for compliance
- **Soft Deletes**: Data recovery capabilities
- **Idempotency**: Protection against duplicate operations

## 📈 Performance Considerations

- **Index Strategy**: Optimized for multi-tenant queries
- **Caching**: Redis integration for frequently accessed data
- **Background Processing**: Async operations for heavy tasks
- **Pagination**: Cursor-based pagination for large datasets
- **Materialized Views**: Pre-computed analytics for performance

## 🔄 Data Flow

1. **Authentication**: JWT tokens with organization context
2. **Authorization**: Role-based access control
3. **Data Access**: Tenant-scoped queries with proper filtering
4. **Event Processing**: Audit logging and outbox pattern
5. **Background Jobs**: Async processing for heavy operations

## 📝 Maintenance

### Schema Updates

- Use Prisma migrations for schema changes
- Maintain backward compatibility
- Update ERDs after schema changes

### Performance Monitoring

- Monitor query performance with EXPLAIN ANALYZE
- Track index usage and optimization opportunities
- Monitor background job processing

### Data Integrity

- Regular constraint validation
- Audit log monitoring
- Backup and recovery procedures

---

**Generated**: $(date)  
**Schema Version**: Latest Prisma schema  
**Documentation**: Comprehensive ERD documentation
