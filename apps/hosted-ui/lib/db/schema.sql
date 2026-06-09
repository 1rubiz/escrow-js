-- Ruby Escrow Transaction Ledger Schema
-- PostgreSQL Database Schema for Independent Transaction Tracking
-- 
-- This schema provides complete audit trail and status tracking
-- independent of Payluk API, enabling custom queries and analytics.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: customers
-- Mirrors Payluk customer data with local tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payluk_customer_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

CREATE INDEX idx_customers_payluk_id ON customers(payluk_customer_id);
CREATE INDEX idx_customers_email ON customers(email);

-- ============================================================================
-- TABLE: transactions
-- Core escrow transaction records
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payluk_escrow_id VARCHAR(255) UNIQUE NOT NULL,
    payment_token VARCHAR(255) UNIQUE NOT NULL,
    seller_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    buyer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'NGN' NOT NULL,
    purpose TEXT NOT NULL,
    description TEXT,
    current_status VARCHAR(20) NOT NULL,
    who_pays VARCHAR(10) DEFAULT 'buyer' CHECK (who_pays IN ('buyer', 'seller')),
    image_url TEXT,
    max_delivery INTEGER DEFAULT 20,
    delivery_timeline VARCHAR(20) DEFAULT 'minutes',
    total_quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

CREATE INDEX idx_transactions_payluk_escrow_id ON transactions(payluk_escrow_id);
CREATE INDEX idx_transactions_payment_token ON transactions(payment_token);
CREATE INDEX idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX idx_transactions_status ON transactions(current_status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- ============================================================================
-- TABLE: transaction_status_history
-- Complete audit trail of every status change
-- ============================================================================
CREATE TABLE IF NOT EXISTS transaction_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    from_status VARCHAR(20),
    to_status VARCHAR(20) NOT NULL,
    changed_by VARCHAR(50),
    reason TEXT,
    payluk_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_status_history_transaction_id ON transaction_status_history(transaction_id);
CREATE INDEX idx_status_history_created_at ON transaction_status_history(transaction_id, created_at DESC);
CREATE INDEX idx_status_history_to_status ON transaction_status_history(to_status);

-- ============================================================================
-- TABLE: payments
-- Payment attempts and results
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    payluk_reference VARCHAR(255) UNIQUE,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    gateway VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    card_id VARCHAR(255),
    error_message TEXT,
    payluk_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_payluk_reference ON payments(payluk_reference);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- ============================================================================
-- TABLE: disputes
-- Dispute records and resolution
-- ============================================================================
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    payluk_dispute_id VARCHAR(255) UNIQUE,
    opened_by UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    opened_by_role VARCHAR(10) NOT NULL CHECK (opened_by_role IN ('buyer', 'seller')),
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL,
    resolution TEXT,
    winner VARCHAR(10) CHECK (winner IN ('buyer', 'seller')),
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

CREATE INDEX idx_disputes_transaction_id ON disputes(transaction_id);
CREATE INDEX idx_disputes_opened_by ON disputes(opened_by);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_payluk_dispute_id ON disputes(payluk_dispute_id);
CREATE INDEX idx_disputes_opened_at ON disputes(opened_at DESC);

-- ============================================================================
-- TABLE: dispute_messages
-- Dispute communication thread
-- ============================================================================
CREATE TABLE IF NOT EXISTS dispute_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    sender_role VARCHAR(10) NOT NULL CHECK (sender_role IN ('buyer', 'seller', 'admin', 'system')),
    message TEXT NOT NULL,
    proof_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_dispute_messages_dispute_id ON dispute_messages(dispute_id);
CREATE INDEX idx_dispute_messages_created_at ON dispute_messages(dispute_id, created_at ASC);

-- ============================================================================
-- TABLE: api_logs
-- Complete audit of all Payluk API interactions
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    request_body JSONB,
    response_body JSONB,
    status_code INTEGER NOT NULL,
    duration_ms INTEGER,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_logs_transaction_id ON api_logs(transaction_id);
CREATE INDEX idx_api_logs_endpoint ON api_logs(endpoint);
CREATE INDEX idx_api_logs_created_at ON api_logs(created_at DESC);
CREATE INDEX idx_api_logs_status_code ON api_logs(status_code);

-- ============================================================================
-- TABLE: webhooks
-- Webhook events from Payluk
-- ============================================================================
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhooks_event_type ON webhooks(event_type);
CREATE INDEX idx_webhooks_transaction_id ON webhooks(transaction_id);
CREATE INDEX idx_webhooks_processed ON webhooks(processed, created_at);
CREATE INDEX idx_webhooks_created_at ON webhooks(created_at DESC);

-- ============================================================================
-- TRIGGERS: Auto-update timestamps
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for customers table
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for transactions table
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS: Useful query views
-- ============================================================================

-- View: Transaction summary with customer details
CREATE OR REPLACE VIEW transaction_summary AS
SELECT 
    t.id,
    t.payluk_escrow_id,
    t.payment_token,
    t.amount,
    t.currency,
    t.purpose,
    t.current_status,
    t.created_at,
    t.updated_at,
    t.completed_at,
    s.name AS seller_name,
    s.email AS seller_email,
    b.name AS buyer_name,
    b.email AS buyer_email
FROM transactions t
LEFT JOIN customers s ON t.seller_id = s.id
LEFT JOIN customers b ON t.buyer_id = b.id;

-- View: Recent status changes
CREATE OR REPLACE VIEW recent_status_changes AS
SELECT 
    tsh.id,
    tsh.transaction_id,
    t.payluk_escrow_id,
    tsh.from_status,
    tsh.to_status,
    tsh.changed_by,
    tsh.reason,
    tsh.created_at
FROM transaction_status_history tsh
JOIN transactions t ON tsh.transaction_id = t.id
ORDER BY tsh.created_at DESC;

-- View: Active disputes
CREATE OR REPLACE VIEW active_disputes AS
SELECT 
    d.id,
    d.transaction_id,
    t.payluk_escrow_id,
    t.amount,
    d.opened_by_role,
    d.reason,
    d.status,
    d.opened_at,
    c.name AS opened_by_name,
    c.email AS opened_by_email
FROM disputes d
JOIN transactions t ON d.transaction_id = t.id
JOIN customers c ON d.opened_by = c.id
WHERE d.status IN ('open', 'investigating')
ORDER BY d.opened_at DESC;

-- ============================================================================
-- COMMENTS: Table and column documentation
-- ============================================================================

COMMENT ON TABLE customers IS 'Mirrors Payluk customer data for local reference';
COMMENT ON TABLE transactions IS 'Core escrow transaction records with full details';
COMMENT ON TABLE transaction_status_history IS 'Complete audit trail of all status changes';
COMMENT ON TABLE payments IS 'Payment attempts and results for transactions';
COMMENT ON TABLE disputes IS 'Dispute records with resolution tracking';
COMMENT ON TABLE dispute_messages IS 'Communication thread for disputes';
COMMENT ON TABLE api_logs IS 'Audit log of all Payluk API interactions';
COMMENT ON TABLE webhooks IS 'Webhook events received from Payluk';
COMMENT ON TABLE session_customers IS 'Per-owner participant history for quick-select dropdown in the hosted UI';

COMMENT ON COLUMN transactions.current_status IS 'PENDING, ONGOING, COMPLETED, REFUNDED, CLAIMED, DISPUTED, INVESTIGATING';
COMMENT ON COLUMN transactions.who_pays IS 'Who pays the escrow fee: buyer or seller';
COMMENT ON COLUMN transaction_status_history.changed_by IS 'buyer, seller, system, or admin';
COMMENT ON COLUMN payments.gateway IS 'Payment gateway used: card, wallet, etc.';
COMMENT ON COLUMN payments.status IS 'pending, success, or failed';
COMMENT ON COLUMN disputes.status IS 'open, investigating, resolved, or cancelled';
COMMENT ON COLUMN session_customers.last_role IS 'Role the participant played in their most recent transaction with this owner';

-- ============================================================================
-- TABLE: session_customers
-- Per-session-owner participant history.
-- One row per (owner_payluk_id, participant_payluk_id) pair.
-- Used to populate the "recent participants" dropdown in the hosted UI.
-- Written on every successful transaction creation.
-- ============================================================================
CREATE TABLE IF NOT EXISTS session_customers (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- The customerId of the SDK caller (session initiator / owner)
    owner_payluk_id       VARCHAR(255) NOT NULL,
    -- The customerId of the other party they transacted with
    participant_payluk_id VARCHAR(255) NOT NULL,
    -- Denormalised display info for fast reads (no JOIN needed)
    participant_name      VARCHAR(255),
    participant_email     VARCHAR(255),
    -- Role the participant played in the most recent transaction with this owner
    last_role             VARCHAR(10) CHECK (last_role IN ('buyer', 'seller')),
    -- Timestamp of the most recent transaction between this pair
    last_transacted_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Running total of transactions between this pair
    transaction_count     INTEGER DEFAULT 1 CHECK (transaction_count > 0),
    -- Enforce one row per (owner, participant) pair
    CONSTRAINT uq_session_customers UNIQUE (owner_payluk_id, participant_payluk_id)
);

CREATE INDEX idx_sc_owner            ON session_customers(owner_payluk_id);
CREATE INDEX idx_sc_participant      ON session_customers(participant_payluk_id);
CREATE INDEX idx_sc_last_transacted  ON session_customers(owner_payluk_id, last_transacted_at DESC);

-- Made with Bob