-- Migration 002: Add session_customers table
-- Phase 7 – Participant history for hosted-UI quick-select dropdown
--
-- Run this migration against an existing Phase 6 database to add
-- the session_customers table without touching existing tables.

-- ============================================================================
-- TABLE: session_customers
-- ============================================================================
CREATE TABLE IF NOT EXISTS session_customers (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_payluk_id       VARCHAR(255) NOT NULL,
    participant_payluk_id VARCHAR(255) NOT NULL,
    participant_name      VARCHAR(255),
    participant_email     VARCHAR(255),
    last_role             VARCHAR(10) CHECK (last_role IN ('buyer', 'seller')),
    last_transacted_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    transaction_count     INTEGER DEFAULT 1 CHECK (transaction_count > 0),
    CONSTRAINT uq_session_customers UNIQUE (owner_payluk_id, participant_payluk_id)
);

CREATE INDEX IF NOT EXISTS idx_sc_owner           ON session_customers(owner_payluk_id);
CREATE INDEX IF NOT EXISTS idx_sc_participant     ON session_customers(participant_payluk_id);
CREATE INDEX IF NOT EXISTS idx_sc_last_transacted ON session_customers(owner_payluk_id, last_transacted_at DESC);

-- Comments
COMMENT ON TABLE session_customers IS 'Per-owner participant history for quick-select dropdown in the hosted UI';
COMMENT ON COLUMN session_customers.owner_payluk_id IS 'Payluk customer ID of the SDK session initiator';
COMMENT ON COLUMN session_customers.participant_payluk_id IS 'Payluk customer ID of the other party';
COMMENT ON COLUMN session_customers.participant_name IS 'Cached display name — updated on each transaction';
COMMENT ON COLUMN session_customers.participant_email IS 'Cached email — updated on each transaction';
COMMENT ON COLUMN session_customers.last_role IS 'Role participant played in their most recent transaction with this owner';
COMMENT ON COLUMN session_customers.last_transacted_at IS 'Timestamp of the most recent transaction between this pair';
COMMENT ON COLUMN session_customers.transaction_count IS 'Running total of transactions between owner and participant';
