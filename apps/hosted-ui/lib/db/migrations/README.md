# Database Migrations

This directory contains SQL migration files for the Ruby Escrow database schema.

## Migration Naming Convention

Migrations are numbered sequentially:
- `001_initial.sql` - Initial schema setup
- `002_add_feature.sql` - Next migration
- `003_modify_table.sql` - And so on...

## Creating a New Migration

1. Create a new file with the next sequential number:
   ```bash
   touch lib/db/migrations/002_your_migration_name.sql
   ```

2. Write your SQL changes:
   ```sql
   -- Migration 002: Add new feature
   -- Created: YYYY-MM-DD
   -- Description: What this migration does
   
   ALTER TABLE transactions ADD COLUMN new_field VARCHAR(255);
   CREATE INDEX idx_transactions_new_field ON transactions(new_field);
   ```

3. Run the migration:
   ```bash
   npm run db:migrate
   ```

## Migration Best Practices

- **Always test migrations** on a development database first
- **Make migrations reversible** when possible (include rollback SQL in comments)
- **Keep migrations small** - one logical change per migration
- **Never modify existing migrations** that have been deployed
- **Document breaking changes** clearly in the migration file
- **Use transactions** for multi-statement migrations

## Rollback Example

Include rollback instructions in comments:

```sql
-- Migration 002: Add user preferences
-- Rollback: DROP TABLE user_preferences;

CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES customers(id),
    preferences JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Migration Status

Track which migrations have been applied by checking the database or maintaining a migrations table:

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Made with Bob