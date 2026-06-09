/**
 * Customer Query Functions
 * 
 * CRUD operations for the customers table
 */

import { query } from '../client';

export interface Customer {
  id: string;
  payluk_customer_id: string;
  email: string;
  name: string;
  phone?: string;
  created_at: Date;
  updated_at: Date;
  metadata?: Record<string, any>;
}

export interface CreateCustomerData {
  paylukCustomerId: string;
  email: string;
  name: string;
  phone?: string;
  metadata?: Record<string, any>;
}

export interface UpdateCustomerData {
  email?: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, any>;
}

/**
 * Create a new customer
 */
export async function createCustomer(data: CreateCustomerData): Promise<Customer> {
  const result = await query<Customer>(
    `INSERT INTO customers (payluk_customer_id, email, name, phone, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [data.paylukCustomerId, data.email, data.name, data.phone || null, data.metadata ? JSON.stringify(data.metadata) : null]
  );

  return result.rows[0];
}

/**
 * Get customer by ID
 */
export async function getCustomerById(id: string): Promise<Customer | null> {
  const result = await query<Customer>(
    'SELECT * FROM customers WHERE id = $1',
    [id]
  );

  return result.rows[0] || null;
}

/**
 * Get customer by Payluk customer ID
 */
export async function getCustomerByPaylukId(paylukCustomerId: string): Promise<Customer | null> {
  const result = await query<Customer>(
    'SELECT * FROM customers WHERE payluk_customer_id = $1',
    [paylukCustomerId]
  );

  return result.rows[0] || null;
}

/**
 * Get customer by email
 */
export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  const result = await query<Customer>(
    'SELECT * FROM customers WHERE email = $1',
    [email]
  );

  return result.rows[0] || null;
}

/**
 * Update customer
 */
export async function updateCustomer(id: string, data: UpdateCustomerData): Promise<Customer | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.email !== undefined) {
    updates.push(`email = $${paramCount++}`);
    values.push(data.email);
  }

  if (data.name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(data.name);
  }

  if (data.phone !== undefined) {
    updates.push(`phone = $${paramCount++}`);
    values.push(data.phone);
  }

  if (data.metadata !== undefined) {
    updates.push(`metadata = $${paramCount++}`);
    values.push(JSON.stringify(data.metadata));
  }

  if (updates.length === 0) {
    return getCustomerById(id);
  }

  values.push(id);

  const result = await query<Customer>(
    `UPDATE customers SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  return result.rows[0] || null;
}

/**
 * Get all customers with pagination
 */
export async function getCustomers(limit: number = 50, offset: number = 0): Promise<Customer[]> {
  const result = await query<Customer>(
    'SELECT * FROM customers ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );

  return result.rows;
}

/**
 * Search customers by name or email
 */
export async function searchCustomers(searchTerm: string, limit: number = 50): Promise<Customer[]> {
  const result = await query<Customer>(
    `SELECT * FROM customers 
     WHERE name ILIKE $1 OR email ILIKE $1 
     ORDER BY created_at DESC 
     LIMIT $2`,
    [`%${searchTerm}%`, limit]
  );

  return result.rows;
}

/**
 * Get customer count
 */
export async function getCustomerCount(): Promise<number> {
  const result = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM customers'
  );

  return parseInt(result.rows[0].count, 10);
}

/**
 * Check if customer exists by Payluk ID
 */
export async function customerExists(paylukCustomerId: string): Promise<boolean> {
  const result = await query<{ exists: boolean }>(
    'SELECT EXISTS(SELECT 1 FROM customers WHERE payluk_customer_id = $1) as exists',
    [paylukCustomerId]
  );

  return result.rows[0].exists;
}

/**
 * Get or create customer (upsert)
 */
export async function getOrCreateCustomer(data: CreateCustomerData): Promise<Customer> {
  // Try to get existing customer
  const existing = await getCustomerByPaylukId(data.paylukCustomerId);
  
  if (existing) {
    return existing;
  }

  // Create new customer
  return createCustomer(data);
}

// ============================================================================
// Session Customer queries (participant history per owner)
// ============================================================================

export interface SessionCustomer {
  id: string;
  owner_payluk_id: string;
  participant_payluk_id: string;
  participant_name?: string;
  participant_email?: string;
  last_role?: 'buyer' | 'seller';
  last_transacted_at: Date;
  transaction_count: number;
}

export interface UpsertSessionCustomerData {
  ownerPaylukId: string;
  participantPaylukId: string;
  participantName?: string;
  participantEmail?: string;
  role: 'buyer' | 'seller';
}

/**
 * Insert or update a session_customers row.
 * On conflict (same owner + participant pair):
 *   - increments transaction_count
 *   - refreshes last_transacted_at and last_role
 *   - updates cached name/email if provided
 *
 * Called immediately after a successful transaction creation.
 */
export async function upsertSessionCustomer(
  data: UpsertSessionCustomerData
): Promise<SessionCustomer> {
  const result = await query<SessionCustomer>(
    `INSERT INTO session_customers
       (owner_payluk_id, participant_payluk_id, participant_name, participant_email, last_role)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT ON CONSTRAINT uq_session_customers
     DO UPDATE SET
       participant_name    = COALESCE(EXCLUDED.participant_name, session_customers.participant_name),
       participant_email   = COALESCE(EXCLUDED.participant_email, session_customers.participant_email),
       last_role           = EXCLUDED.last_role,
       last_transacted_at  = NOW(),
       transaction_count   = session_customers.transaction_count + 1
     RETURNING *`,
    [
      data.ownerPaylukId,
      data.participantPaylukId,
      data.participantName ?? null,
      data.participantEmail ?? null,
      data.role,
    ]
  );

  return result.rows[0];
}

/**
 * Get all participants for a given owner, ordered by most-recently transacted first.
 * Used to populate the recent-participants dropdown in the hosted UI.
 */
export async function getSessionCustomers(
  ownerPaylukId: string,
  limit: number = 50
): Promise<SessionCustomer[]> {
  const result = await query<SessionCustomer>(
    `SELECT *
     FROM session_customers
     WHERE owner_payluk_id = $1
     ORDER BY last_transacted_at DESC
     LIMIT $2`,
    [ownerPaylukId, limit]
  );

  return result.rows;
}

// Made with Bob