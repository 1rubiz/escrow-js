/**
 * Transaction Query Functions
 * 
 * CRUD operations for the transactions table
 */

import { query, transaction as dbTransaction } from '../client';

export type EscrowStatus = 
  | 'PENDING' 
  | 'ONGOING' 
  | 'COMPLETED' 
  | 'REFUNDED' 
  | 'CLAIMED' 
  | 'DISPUTED' 
  | 'INVESTIGATING';

export interface Transaction {
  id: string;
  payluk_escrow_id: string;
  payment_token: string;
  seller_id: string;
  buyer_id?: string;
  amount: number;
  currency: string;
  purpose: string;
  description?: string;
  current_status: EscrowStatus;
  who_pays: 'buyer' | 'seller';
  image_url?: string;
  max_delivery: number;
  delivery_timeline: string;
  total_quantity: number;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
  metadata?: Record<string, any>;
}

export interface CreateTransactionData {
  paylukEscrowId: string;
  paymentToken: string;
  sellerId: string;
  buyerId?: string;
  amount: number;
  currency?: string;
  purpose: string;
  description?: string;
  whoPays?: 'buyer' | 'seller';
  imageUrl?: string;
  maxDelivery?: number;
  deliveryTimeline?: string;
  totalQuantity?: number;
  metadata?: Record<string, any>;
}

export interface UpdateTransactionData {
  buyerId?: string;
  currentStatus?: EscrowStatus;
  description?: string;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * Create a new transaction
 */
export async function createTransaction(data: CreateTransactionData): Promise<Transaction> {
  const result = await query<Transaction>(
    `INSERT INTO transactions (
      payluk_escrow_id, payment_token, seller_id, buyer_id, amount, currency,
      purpose, description, current_status, who_pays, image_url, max_delivery,
      delivery_timeline, total_quantity, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *`,
    [
      data.paylukEscrowId,
      data.paymentToken,
      data.sellerId,
      data.buyerId || null,
      data.amount,
      data.currency || 'NGN',
      data.purpose,
      data.description || null,
      'PENDING', // Initial status
      data.whoPays || 'buyer',
      data.imageUrl || null,
      data.maxDelivery || 20,
      data.deliveryTimeline || 'minutes',
      data.totalQuantity || 1,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ]
  );

  return result.rows[0];
}

/**
 * Get transaction by ID
 */
export async function getTransaction(id: string): Promise<Transaction | null> {
  const result = await query<Transaction>(
    'SELECT * FROM transactions WHERE id = $1',
    [id]
  );

  return result.rows[0] || null;
}

/**
 * Get transaction by Payluk escrow ID
 */
export async function getTransactionByPaylukId(paylukEscrowId: string): Promise<Transaction | null> {
  const result = await query<Transaction>(
    'SELECT * FROM transactions WHERE payluk_escrow_id = $1',
    [paylukEscrowId]
  );

  return result.rows[0] || null;
}

/**
 * Get transaction by payment token
 */
export async function getTransactionByPaymentToken(paymentToken: string): Promise<Transaction | null> {
  const result = await query<Transaction>(
    'SELECT * FROM transactions WHERE payment_token = $1',
    [paymentToken]
  );

  return result.rows[0] || null;
}

/**
 * Update transaction
 */
export async function updateTransaction(id: string, data: UpdateTransactionData): Promise<Transaction | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.buyerId !== undefined) {
    updates.push(`buyer_id = $${paramCount++}`);
    values.push(data.buyerId);
  }

  if (data.currentStatus !== undefined) {
    updates.push(`current_status = $${paramCount++}`);
    values.push(data.currentStatus);
  }

  if (data.description !== undefined) {
    updates.push(`description = $${paramCount++}`);
    values.push(data.description);
  }

  if (data.completedAt !== undefined) {
    updates.push(`completed_at = $${paramCount++}`);
    values.push(data.completedAt);
  }

  if (data.metadata !== undefined) {
    updates.push(`metadata = $${paramCount++}`);
    values.push(JSON.stringify(data.metadata));
  }

  if (updates.length === 0) {
    return getTransaction(id);
  }

  values.push(id);

  const result = await query<Transaction>(
    `UPDATE transactions SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  return result.rows[0] || null;
}

/**
 * Update transaction status with history tracking
 */
export async function updateTransactionStatus(
  transactionId: string,
  newStatus: EscrowStatus,
  changedBy?: string,
  reason?: string,
  paylukResponse?: Record<string, any>
): Promise<Transaction | null> {
  return dbTransaction(async (client) => {
    // Get current transaction
    const txnResult = await client.query<Transaction>(
      'SELECT * FROM transactions WHERE id = $1',
      [transactionId]
    );

    if (txnResult.rows.length === 0) {
      throw new Error('Transaction not found');
    }

    const transaction = txnResult.rows[0];
    const oldStatus = transaction.current_status;

    // Update transaction status
    const updateResult = await client.query<Transaction>(
      `UPDATE transactions 
       SET current_status = $1, 
           completed_at = CASE WHEN $1 IN ('COMPLETED', 'REFUNDED') THEN NOW() ELSE completed_at END
       WHERE id = $2 
       RETURNING *`,
      [newStatus, transactionId]
    );

    // Record status change in history
    await client.query(
      `INSERT INTO transaction_status_history 
       (transaction_id, from_status, to_status, changed_by, reason, payluk_response)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        transactionId,
        oldStatus,
        newStatus,
        changedBy || null,
        reason || null,
        paylukResponse ? JSON.stringify(paylukResponse) : null,
      ]
    );

    return updateResult.rows[0];
  });
}

/**
 * Get transactions by seller
 */
export async function getTransactionsBySeller(
  sellerId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Transaction[]> {
  const result = await query<Transaction>(
    `SELECT * FROM transactions 
     WHERE seller_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2 OFFSET $3`,
    [sellerId, limit, offset]
  );

  return result.rows;
}

/**
 * Get transactions by buyer
 */
export async function getTransactionsByBuyer(
  buyerId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Transaction[]> {
  const result = await query<Transaction>(
    `SELECT * FROM transactions 
     WHERE buyer_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2 OFFSET $3`,
    [buyerId, limit, offset]
  );

  return result.rows;
}

/**
 * Get transactions by status
 */
export async function getTransactionsByStatus(
  status: EscrowStatus,
  limit: number = 50,
  offset: number = 0
): Promise<Transaction[]> {
  const result = await query<Transaction>(
    `SELECT * FROM transactions 
     WHERE current_status = $1 
     ORDER BY created_at DESC 
     LIMIT $2 OFFSET $3`,
    [status, limit, offset]
  );

  return result.rows;
}

/**
 * Get all transactions with pagination
 */
export async function getTransactions(
  limit: number = 50,
  offset: number = 0
): Promise<Transaction[]> {
  const result = await query<Transaction>(
    'SELECT * FROM transactions ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );

  return result.rows;
}

/**
 * Get transaction count
 */
export async function getTransactionCount(): Promise<number> {
  const result = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM transactions'
  );

  return parseInt(result.rows[0].count, 10);
}

/**
 * Get transaction count by status
 */
export async function getTransactionCountByStatus(status: EscrowStatus): Promise<number> {
  const result = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM transactions WHERE current_status = $1',
    [status]
  );

  return parseInt(result.rows[0].count, 10);
}

/**
 * Get transactions within date range
 */
export async function getTransactionsByDateRange(
  startDate: Date,
  endDate: Date,
  limit: number = 100,
  offset: number = 0
): Promise<Transaction[]> {
  const result = await query<Transaction>(
    `SELECT * FROM transactions 
     WHERE created_at >= $1 AND created_at <= $2 
     ORDER BY created_at DESC 
     LIMIT $3 OFFSET $4`,
    [startDate, endDate, limit, offset]
  );

  return result.rows;
}

/**
 * Search transactions by purpose or description
 */
export async function searchTransactions(
  searchTerm: string,
  limit: number = 50
): Promise<Transaction[]> {
  const result = await query<Transaction>(
    `SELECT * FROM transactions 
     WHERE purpose ILIKE $1 OR description ILIKE $1 
     ORDER BY created_at DESC 
     LIMIT $2`,
    [`%${searchTerm}%`, limit]
  );

  return result.rows;
}

/**
 * Get transaction with customer details (using view)
 */
export async function getTransactionWithDetails(id: string) {
  const result = await query(
    'SELECT * FROM transaction_summary WHERE id = $1',
    [id]
  );

  return result.rows[0] || null;
}

/**
 * Check if transaction exists
 */
export async function transactionExists(paylukEscrowId: string): Promise<boolean> {
  const result = await query<{ exists: boolean }>(
    'SELECT EXISTS(SELECT 1 FROM transactions WHERE payluk_escrow_id = $1) as exists',
    [paylukEscrowId]
  );

  return result.rows[0].exists;
}

// Made with Bob