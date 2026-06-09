import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, errorResponse, unauthorizedResponse } from '@/lib/auth';
import { query } from '@/lib/db/client';

interface StatusHistoryRow {
  id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string | null;
  reason: string | null;
  created_at: Date;
}

/**
 * GET /api/payluk/transactions/[transactionId]/status-history
 *
 * Returns the full status change audit trail for a transaction.
 * Uses the Payluk escrow ID (`transactionId` param) to look up the record.
 *
 * Requires API key authentication.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { transactionId: string } }
) {
  try {
    const authResult = validateApiKey(request);
    if (!authResult.valid) {
      return unauthorizedResponse(authResult.error || 'Unauthorized');
    }

    const { transactionId } = params;
    if (!transactionId) {
      return errorResponse('Transaction ID is required', 400);
    }

    // Fetch status history joined through transactions table by payluk_escrow_id
    const result = await query<StatusHistoryRow>(
      `SELECT
         tsh.id,
         tsh.from_status,
         tsh.to_status,
         tsh.changed_by,
         tsh.reason,
         tsh.created_at
       FROM transaction_status_history tsh
       INNER JOIN transactions t ON t.id = tsh.transaction_id
       WHERE t.payluk_escrow_id = $1
       ORDER BY tsh.created_at ASC`,
      [transactionId]
    );

    return NextResponse.json({
      success: true,
      transactionId,
      history: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Status history error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve status history';
    return errorResponse(errorMessage, 500);
  }
}

// Made with Bob
