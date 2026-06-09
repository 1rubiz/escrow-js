# Database Layer

This directory contains the PostgreSQL database implementation for the Ruby Escrow transaction ledger.

## Overview

The database layer provides:
- Independent transaction tracking (not reliant on Payluk API)
- Complete status change history with timestamps
- Custom querying capabilities
- Audit trail for compliance
- Analytics and reporting

## Setup

### 1. Install PostgreSQL

Make sure PostgreSQL is installed and running on your system.

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**macOS (with Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Windows:**
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

### 2. Create Database

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE ruby_escrow;
CREATE USER ruby_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ruby_escrow TO ruby_user;

# Exit psql
\q
```

### 3. Configure Environment

Copy `.env.local.example` to `.env.local` and update the database connection:

```env
DATABASE_URL=postgresql://ruby_user:your_secure_password@localhost:5432/ruby_escrow
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
```

### 4. Install tsx (if not already installed)

```bash
npm install --save-dev tsx
```

### 5. Run Database Setup

```bash
npm run db:setup
```

This will:
- Check database connection
- Create all tables and indexes
- Verify the schema

## Database Schema

### Core Tables

1. **customers** - Payluk customer mirror
2. **transactions** - Escrow transaction records
3. **transaction_status_history** - Complete status change audit trail
4. **payments** - Payment attempts and results
5. **disputes** - Dispute records
6. **dispute_messages** - Dispute communication threads
7. **api_logs** - All Payluk API interactions
8. **webhooks** - Webhook events from Payluk

### Status Flow

```
PENDING → ONGOING → COMPLETED
                  ↓
              CLAIMED → COMPLETED (if no dispute)
                  ↓
              DISPUTED → INVESTIGATING → COMPLETED/REFUNDED
```

## Usage

### Query Functions

```typescript
import { query, transaction } from '@/lib/db/client';
import * as transactions from '@/lib/db/queries/transactions';

// Get a transaction
const txn = await transactions.getTransaction('txn_id');

// Create a transaction
const newTxn = await transactions.createTransaction({
  paylukEscrowId: 'escrow_123',
  paymentToken: 'token_456',
  sellerId: 'seller_uuid',
  amount: 1000,
  purpose: 'Product purchase',
  // ...
});

// Update status
await transactions.updateTransactionStatus(
  'txn_id',
  'ONGOING',
  'buyer',
  'Payment completed'
);
```

### Transactions

```typescript
import { transaction } from '@/lib/db/client';

await transaction(async (client) => {
  // Multiple queries in a transaction
  await client.query('INSERT INTO ...');
  await client.query('UPDATE ...');
  // Automatically commits or rolls back
});
```

## Migrations

Database migrations are stored in `lib/db/migrations/` directory.

To create a new migration:

1. Create a new file: `migrations/002_add_feature.sql`
2. Write your SQL changes
3. Run: `npm run db:migrate`

## Maintenance

### Backup Database

```bash
pg_dump -U ruby_user ruby_escrow > backup.sql
```

### Restore Database

```bash
psql -U ruby_user ruby_escrow < backup.sql
```

### Check Connection

```typescript
import { healthCheck } from '@/lib/db/client';

const isHealthy = await healthCheck();
```

## Performance

- Indexes are created on frequently queried columns
- Connection pooling is configured (min: 2, max: 10)
- Slow queries (>1000ms) are automatically logged
- Use `EXPLAIN ANALYZE` for query optimization

## Security

- Never commit `.env.local` with real credentials
- Use strong passwords for database users
- Limit database user permissions in production
- Enable SSL for production connections
- Regularly update PostgreSQL

## Troubleshooting

### Connection Issues

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U ruby_user -d ruby_escrow -h localhost
```

### Permission Errors

```sql
-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ruby_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ruby_user;
```

### Reset Database

```bash
# Drop and recreate (WARNING: deletes all data)
psql -U postgres
DROP DATABASE ruby_escrow;
CREATE DATABASE ruby_escrow;
GRANT ALL PRIVILEGES ON DATABASE ruby_escrow TO ruby_user;
\q

# Run setup again
npm run db:setup
```

## Made with Bob