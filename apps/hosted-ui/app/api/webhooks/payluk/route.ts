/**
 * POST /api/webhooks/payluk
 *
 * Receives and processes real-time Payluk webhook events.
 *
 * Security:
 *  - Verifies HMAC-SHA512 signature in the `x-payluk-signature` header
 *  - Rejects any request that fails signature validation
 *
 * Idempotency:
 *  - Checks the `webhooks` table before processing
 *  - Duplicate events (same Payluk event ID) are acknowledged but not re-processed
 *
 * Supported events:
 *  - transaction.created
 *  - payment.completed   → ONGOING
 *  - escrow.completed    → COMPLETED
 *  - escrow.refunded     → REFUNDED
 *  - escrow.claimed      → CLAIMED
 *  - dispute.opened      → DISPUTED
 *  - dispute.investigating → INVESTIGATING
 *  - dispute.resolved    → COMPLETED | REFUNDED
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db/client';
import { syncTransaction, trackStatusChange } from '@/lib/db/middleware/statusTracker';
import { EscrowStatus } from '@/lib/db/queries/transactions';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaylukWebhookPayload {
  /** Unique event identifier from Payluk */
  id: string;
  /** Event name e.g. "escrow.completed" */
  event: string;
  /** ISO timestamp of when the event was generated */
  created_at: string;
  /** Event-specific data */
  data: Record<string, any>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Verify the HMAC-SHA512 signature sent by Payluk.
 * Payluk signs the raw request body with the webhook secret.
 */
function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  try {
    const expected = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');
    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * Persist the raw webhook event to the `webhooks` table.
 * Returns the internal DB id of the created record.
 */
async function saveWebhookEvent(
  eventType: string,
  payload: PaylukWebhookPayload,
  transactionId?: string
): Promise<string> {
  const result = await query<{ id: string }>(
    `INSERT INTO webhooks (event_type, transaction_id, payload, processed, created_at)
     VALUES ($1, $2, $3, false, NOW())
     RETURNING id`,
    [eventType, transactionId || null, JSON.stringify(payload)]
  );
  return result.rows[0].id;
}

/**
 * Mark a webhook record as processed (or failed).
 */
async function markWebhookProcessed(
  webhookDbId: string,
  error?: string
): Promise<void> {
  await query(
    `UPDATE webhooks
     SET processed = $1, processed_at = NOW(), error = $2
     WHERE id = $3`,
    [!error, error || null, webhookDbId]
  );
}

/**
 * Check whether this Payluk event ID has already been processed.
 * We store the Payluk event id inside the payload JSONB column.
 */
async function isEventAlreadyProcessed(paylukEventId: string): Promise<boolean> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) as count
     FROM webhooks
     WHERE payload->>'id' = $1 AND processed = true`,
    [paylukEventId]
  );
  return parseInt(result.rows[0].count, 10) > 0;
}

// ─── Event Handlers ───────────────────────────────────────────────────────────

/**
 * Map Payluk event names to local EscrowStatus values.
 * Returns undefined for events that don't imply a status change.
 */
function resolveStatusFromEvent(
  event: string,
  data: Record<string, any>
): EscrowStatus | undefined {
  switch (event) {
    case 'payment.completed':
      return 'ONGOING';
    case 'escrow.completed':
      return 'COMPLETED';
    case 'escrow.refunded':
      return 'REFUNDED';
    case 'escrow.claimed':
      return 'CLAIMED';
    case 'dispute.opened':
      return 'DISPUTED';
    case 'dispute.investigating':
      return 'INVESTIGATING';
    case 'dispute.resolved': {
      // winner field tells us whether to complete or refund
      const winner = data?.winner || data?.resolution_winner;
      return winner === 'seller' ? 'COMPLETED' : 'REFUNDED';
    }
    default:
      return undefined;
  }
}

/**
 * Extract the Payluk escrow ID from various event payload shapes.
 */
function extractPaylukEscrowId(data: Record<string, any>): string | undefined {
  return (
    data?.escrow_id ||
    data?.escrowId ||
    data?.transaction?.id ||
    data?.transaction?.escrow_id ||
    data?.id
  );
}

/**
 * Extract a human-readable actor from the event.
 */
function resolveActor(event: string, data: Record<string, any>): string {
  if (event.startsWith('dispute')) return 'system';
  const actor = data?.triggered_by || data?.actor;
  if (actor) return actor;
  if (event.includes('buyer')) return 'buyer';
  if (event.includes('seller')) return 'seller';
  return 'payluk';
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Read raw body (needed for signature verification)
  const rawBody = await request.text();

  // 2. Verify signature
  const webhookSecret = process.env.PAYLUK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[webhook] PAYLUK_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const signature = request.headers.get('x-payluk-signature') || '';
  if (!signature) {
    console.warn('[webhook] Missing x-payluk-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  if (!verifySignature(rawBody, signature, webhookSecret)) {
    console.warn('[webhook] Invalid signature — rejecting request');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 3. Parse payload
  let payload: PaylukWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const { id: paylukEventId, event, data } = payload;

  if (!paylukEventId || !event || !data) {
    return NextResponse.json({ error: 'Malformed payload' }, { status: 400 });
  }

  console.log(`[webhook] Received event: ${event} (id=${paylukEventId})`);

  // 4. Idempotency check — skip already-processed events
  const alreadyProcessed = await isEventAlreadyProcessed(paylukEventId).catch(() => false);
  if (alreadyProcessed) {
    console.log(`[webhook] Event ${paylukEventId} already processed — skipping`);
    return NextResponse.json({ ok: true, message: 'Already processed' });
  }

  // 5. Resolve the escrow ID from the payload
  const paylukEscrowId = extractPaylukEscrowId(data);

  // 6. Persist the raw event to the webhooks table
  let webhookDbId: string | undefined;
  try {
    webhookDbId = await saveWebhookEvent(event, payload, paylukEscrowId);
  } catch (err) {
    // Non-fatal — continue processing even if logging fails
    console.error('[webhook] Failed to save webhook event to DB:', err);
  }

  // 7. Process the event
  let processingError: string | undefined;

  try {
    // Handle transaction.created — full sync
    if (event === 'transaction.created') {
      const transaction = data?.transaction || data;
      if (transaction) {
        await syncTransaction(transaction);
      }
    }

    // Handle status-changing events
    const newStatus = resolveStatusFromEvent(event, data);
    if (newStatus && paylukEscrowId) {
      const actor = resolveActor(event, data);
      await trackStatusChange(
        paylukEscrowId,
        newStatus,
        actor,
        `Webhook: ${event}`,
        payload
      );
      console.log(`[webhook] Status updated → ${newStatus} for escrow ${paylukEscrowId}`);
    }

    // For unrecognised events that have a transaction in the payload, do a full sync
    if (!newStatus && event !== 'transaction.created') {
      const embeddedTransaction = data?.transaction;
      if (embeddedTransaction) {
        await syncTransaction(embeddedTransaction);
      }
    }
  } catch (err) {
    processingError = err instanceof Error ? err.message : 'Unknown processing error';
    console.error(`[webhook] Processing failed for event ${event}:`, err);
  }

  // 8. Mark webhook as processed / failed
  if (webhookDbId) {
    await markWebhookProcessed(webhookDbId, processingError).catch((e) => {
      console.error('[webhook] Failed to mark webhook as processed:', e);
    });
  }

  // 9. Always return 200 to Payluk so they don't retry on processing errors
  if (processingError) {
    console.warn(`[webhook] Event ${paylukEventId} processed with error: ${processingError}`);
  }

  return NextResponse.json({ ok: true });
}

// Made with Bob
