/**
 * Dispute Query Functions
 * 
 * CRUD operations for disputes and dispute_messages tables
 */

import { query, transaction as dbTransaction } from '../client';

export type DisputeStatus = 'open' | 'investigating' | 'resolved' | 'cancelled';
export type DisputeRole = 'buyer' | 'seller';
export type MessageSenderRole = 'buyer' | 'seller' | 'admin' | 'system';

export interface Dispute {
  id: string;
  transaction_id: string;
  payluk_dispute_id?: string;
  opened_by: string;
  opened_by_role: DisputeRole;
  reason: string;
  status: DisputeStatus;
  resolution?: string;
  winner?: DisputeRole;
  opened_at: Date;
  resolved_at?: Date;
  metadata?: Record<string, any>;
}

export interface DisputeMessage {
  id: string;
  dispute_id: string;
  sender_id?: string;
  sender_role: MessageSenderRole;
  message: string;
  proof_url?: string;
  created_at: Date;
}

export interface CreateDisputeData {
  transactionId: string;
  paylukDisputeId?: string;
  openedBy: string;
  openedByRole: DisputeRole;
  reason: string;
  metadata?: Record<string, any>;
}

export interface CreateDisputeMessageData {
  disputeId: string;
  senderId?: string;
  senderRole: MessageSenderRole;
  message: string;
  proofUrl?: string;
}

export interface UpdateDisputeData {
  status?: DisputeStatus;
  resolution?: string;
  winner?: DisputeRole;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * Create a new dispute
 */
export async function createDispute(data: CreateDisputeData): Promise<Dispute> {
  const result = await query<Dispute>(
    `INSERT INTO disputes (
      transaction_id, payluk_dispute_id, opened_by, opened_by_role,
      reason, status, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      data.transactionId,
      data.paylukDisputeId || null,
      data.openedBy,
      data.openedByRole,
      data.reason,
      'open',
      data.metadata ? JSON.stringify(data.metadata) : null,
    ]
  );

  return result.rows[0];
}

/**
 * Get dispute by ID
 */
export async function getDispute(id: string): Promise<Dispute | null> {
  const result = await query<Dispute>(
    'SELECT * FROM disputes WHERE id = $1',
    [id]
  );

  return result.rows[0] || null;
}

/**
 * Get dispute by Payluk dispute ID
 */
export async function getDisputeByPaylukId(paylukDisputeId: string): Promise<Dispute | null> {
  const result = await query<Dispute>(
    'SELECT * FROM disputes WHERE payluk_dispute_id = $1',
    [paylukDisputeId]
  );

  return result.rows[0] || null;
}

/**
 * Get disputes for a transaction
 */
export async function getDisputesByTransaction(transactionId: string): Promise<Dispute[]> {
  const result = await query<Dispute>(
    'SELECT * FROM disputes WHERE transaction_id = $1 ORDER BY opened_at DESC',
    [transactionId]
  );

  return result.rows;
}

/**
 * Get disputes by status
 */
export async function getDisputesByStatus(
  status: DisputeStatus,
  limit: number = 50,
  offset: number = 0
): Promise<Dispute[]> {
  const result = await query<Dispute>(
    `SELECT * FROM disputes 
     WHERE status = $1 
     ORDER BY opened_at DESC 
     LIMIT $2 OFFSET $3`,
    [status, limit, offset]
  );

  return result.rows;
}

/**
 * Get active disputes (open or investigating)
 */
export async function getActiveDisputes(limit: number = 50, offset: number = 0): Promise<Dispute[]> {
  const result = await query<Dispute>(
    `SELECT * FROM disputes 
     WHERE status IN ('open', 'investigating') 
     ORDER BY opened_at DESC 
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return result.rows;
}

/**
 * Update dispute
 */
export async function updateDispute(id: string, data: UpdateDisputeData): Promise<Dispute | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.status !== undefined) {
    updates.push(`status = $${paramCount++}`);
    values.push(data.status);
  }

  if (data.resolution !== undefined) {
    updates.push(`resolution = $${paramCount++}`);
    values.push(data.resolution);
  }

  if (data.winner !== undefined) {
    updates.push(`winner = $${paramCount++}`);
    values.push(data.winner);
  }

  if (data.resolvedAt !== undefined) {
    updates.push(`resolved_at = $${paramCount++}`);
    values.push(data.resolvedAt);
  }

  if (data.metadata !== undefined) {
    updates.push(`metadata = $${paramCount++}`);
    values.push(JSON.stringify(data.metadata));
  }

  if (updates.length === 0) {
    return getDispute(id);
  }

  values.push(id);

  const result = await query<Dispute>(
    `UPDATE disputes SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  return result.rows[0] || null;
}

/**
 * Resolve dispute
 */
export async function resolveDispute(
  id: string,
  resolution: string,
  winner: DisputeRole
): Promise<Dispute | null> {
  return updateDispute(id, {
    status: 'resolved',
    resolution,
    winner,
    resolvedAt: new Date(),
  });
}

/**
 * Cancel dispute
 */
export async function cancelDispute(id: string): Promise<Dispute | null> {
  return updateDispute(id, {
    status: 'cancelled',
    resolvedAt: new Date(),
  });
}

/**
 * Add message to dispute
 */
export async function addDisputeMessage(data: CreateDisputeMessageData): Promise<DisputeMessage> {
  const result = await query<DisputeMessage>(
    `INSERT INTO dispute_messages (
      dispute_id, sender_id, sender_role, message, proof_url
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [
      data.disputeId,
      data.senderId || null,
      data.senderRole,
      data.message,
      data.proofUrl || null,
    ]
  );

  return result.rows[0];
}

/**
 * Get messages for a dispute
 */
export async function getDisputeMessages(disputeId: string): Promise<DisputeMessage[]> {
  const result = await query<DisputeMessage>(
    'SELECT * FROM dispute_messages WHERE dispute_id = $1 ORDER BY created_at ASC',
    [disputeId]
  );

  return result.rows;
}

/**
 * Get dispute with messages
 */
export async function getDisputeWithMessages(disputeId: string): Promise<{
  dispute: Dispute | null;
  messages: DisputeMessage[];
}> {
  const dispute = await getDispute(disputeId);
  const messages = dispute ? await getDisputeMessages(disputeId) : [];

  return { dispute, messages };
}

/**
 * Get dispute count by status
 */
export async function getDisputeCountByStatus(status: DisputeStatus): Promise<number> {
  const result = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM disputes WHERE status = $1',
    [status]
  );

  return parseInt(result.rows[0].count, 10);
}

/**
 * Get disputes opened by customer
 */
export async function getDisputesByCustomer(
  customerId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Dispute[]> {
  const result = await query<Dispute>(
    `SELECT * FROM disputes 
     WHERE opened_by = $1 
     ORDER BY opened_at DESC 
     LIMIT $2 OFFSET $3`,
    [customerId, limit, offset]
  );

  return result.rows;
}

/**
 * Check if transaction has active dispute
 */
export async function hasActiveDispute(transactionId: string): Promise<boolean> {
  const result = await query<{ exists: boolean }>(
    `SELECT EXISTS(
      SELECT 1 FROM disputes 
      WHERE transaction_id = $1 
      AND status IN ('open', 'investigating')
    ) as exists`,
    [transactionId]
  );

  return result.rows[0].exists;
}

/**
 * Get disputes requiring attention (open for > 24 hours)
 */
export async function getDisputesRequiringAttention(): Promise<Dispute[]> {
  const result = await query<Dispute>(
    `SELECT * FROM disputes 
     WHERE status = 'open' 
     AND opened_at < NOW() - INTERVAL '24 hours'
     ORDER BY opened_at ASC`,
    []
  );

  return result.rows;
}

// Made with Bob