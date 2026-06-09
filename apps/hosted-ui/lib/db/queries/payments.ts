/**
 * Payment Query Functions
 * 
 * CRUD operations for the payments table
 */

import { query } from '../client';

export type PaymentStatus = 'pending' | 'success' | 'failed';

export interface Payment {
  id: string;
  transaction_id: string;
  payluk_reference?: string;
  amount: number;
  gateway: string;
  status: PaymentStatus;
  customer_id: string;
  card_id?: string;
  error_message?: string;
  payluk_response?: Record<string, any>;
  created_at: Date;
  completed_at?: Date;
}

export interface CreatePaymentData {
  transactionId: string;
  paylukReference?: string;
  amount: number;
  gateway: string;
  customerId: string;
  cardId?: string;
  status?: PaymentStatus;
  paylukResponse?: Record<string, any>;
}

export interface UpdatePaymentData {
  status?: PaymentStatus;
  paylukReference?: string;
  errorMessage?: string;
  paylukResponse?: Record<string, any>;
  completedAt?: Date;
}

/**
 * Create a new payment record
 */
export async function createPayment(data: CreatePaymentData): Promise<Payment> {
  const result = await query<Payment>(
    `INSERT INTO payments (
      transaction_id, payluk_reference, amount, gateway, status,
      customer_id, card_id, payluk_response
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      data.transactionId,
      data.paylukReference || null,
      data.amount,
      data.gateway,
      data.status || 'pending',
      data.customerId,
      data.cardId || null,
      data.paylukResponse ? JSON.stringify(data.paylukResponse) : null,
    ]
  );

  return result.rows[0];
}

/**
 * Get payment by ID
 */
export async function getPayment(id: string): Promise<Payment | null> {
  const result = await query<Payment>(
    'SELECT * FROM payments WHERE id = $1',
    [id]
  );

  return result.rows[0] || null;
}

/**
 * Get payment by Payluk reference
 */
export async function getPaymentByReference(paylukReference: string): Promise<Payment | null> {
  const result = await query<Payment>(
    'SELECT * FROM payments WHERE payluk_reference = $1',
    [paylukReference]
  );

  return result.rows[0] || null;
}

/**
 * Get payments for a transaction
 */
export async function getPaymentsByTransaction(transactionId: string): Promise<Payment[]> {
  const result = await query<Payment>(
    'SELECT * FROM payments WHERE transaction_id = $1 ORDER BY created_at DESC',
    [transactionId]
  );

  return result.rows;
}

/**
 * Get payments by customer
 */
export async function getPaymentsByCustomer(
  customerId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Payment[]> {
  const result = await query<Payment>(
    `SELECT * FROM payments 
     WHERE customer_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2 OFFSET $3`,
    [customerId, limit, offset]
  );

  return result.rows;
}

/**
 * Get payments by status
 */
export async function getPaymentsByStatus(
  status: PaymentStatus,
  limit: number = 50,
  offset: number = 0
): Promise<Payment[]> {
  const result = await query<Payment>(
    `SELECT * FROM payments 
     WHERE status = $1 
     ORDER BY created_at DESC 
     LIMIT $2 OFFSET $3`,
    [status, limit, offset]
  );

  return result.rows;
}

/**
 * Update payment
 */
export async function updatePayment(id: string, data: UpdatePaymentData): Promise<Payment | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.status !== undefined) {
    updates.push(`status = $${paramCount++}`);
    values.push(data.status);
  }

  if (data.paylukReference !== undefined) {
    updates.push(`payluk_reference = $${paramCount++}`);
    values.push(data.paylukReference);
  }

  if (data.errorMessage !== undefined) {
    updates.push(`error_message = $${paramCount++}`);
    values.push(data.errorMessage);
  }

  if (data.paylukResponse !== undefined) {
    updates.push(`payluk_response = $${paramCount++}`);
    values.push(JSON.stringify(data.paylukResponse));
  }

  if (data.completedAt !== undefined) {
    updates.push(`completed_at = $${paramCount++}`);
    values.push(data.completedAt);
  }

  if (updates.length === 0) {
    return getPayment(id);
  }

  values.push(id);

  const result = await query<Payment>(
    `UPDATE payments SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  return result.rows[0] || null;
}

/**
 * Mark payment as successful
 */
export async function markPaymentSuccess(
  id: string,
  paylukReference?: string,
  paylukResponse?: Record<string, any>
): Promise<Payment | null> {
  return updatePayment(id, {
    status: 'success',
    paylukReference,
    paylukResponse,
    completedAt: new Date(),
  });
}

/**
 * Mark payment as failed
 */
export async function markPaymentFailed(
  id: string,
  errorMessage: string,
  paylukResponse?: Record<string, any>
): Promise<Payment | null> {
  return updatePayment(id, {
    status: 'failed',
    errorMessage,
    paylukResponse,
    completedAt: new Date(),
  });
}

/**
 * Get payment count by status
 */
export async function getPaymentCountByStatus(status: PaymentStatus): Promise<number> {
  const result = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM payments WHERE status = $1',
    [status]
  );

  return parseInt(result.rows[0].count, 10);
}

/**
 * Get total payment amount by status
 */
export async function getTotalPaymentAmount(status?: PaymentStatus): Promise<number> {
  const sql = status
    ? 'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = $1'
    : 'SELECT COALESCE(SUM(amount), 0) as total FROM payments';
  
  const params = status ? [status] : [];
  const result = await query<{ total: string }>(sql, params);

  return parseFloat(result.rows[0].total);
}

/**
 * Get recent failed payments
 */
export async function getRecentFailedPayments(limit: number = 20): Promise<Payment[]> {
  const result = await query<Payment>(
    `SELECT * FROM payments 
     WHERE status = 'failed' 
     ORDER BY created_at DESC 
     LIMIT $1`,
    [limit]
  );

  return result.rows;
}

/**
 * Get pending payments older than specified minutes
 */
export async function getStalePendingPayments(minutesOld: number = 30): Promise<Payment[]> {
  const result = await query<Payment>(
    `SELECT * FROM payments 
     WHERE status = 'pending' 
     AND created_at < NOW() - INTERVAL '${minutesOld} minutes'
     ORDER BY created_at ASC`,
    []
  );

  return result.rows;
}

// Made with Bob