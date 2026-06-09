import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/db/middleware/logger';
import { trackStatusChange } from '@/lib/db/middleware/statusTracker';

const PAYLUK_API_URL = process.env.PAYLUK_API_URL || 'https://api.payluk.com/v1';
const PAYLUK_SECRET_KEY = process.env.PAYLUK_SECRET_KEY;

/**
 * POST /api/payluk/dispute
 *
 * Lodge a dispute for an escrow transaction.
 * After a successful dispute submission to Payluk, the transaction
 * status is tracked as DISPUTED in the local DB.
 *
 * Body: { transactionId, reason, description, evidence? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId, reason, description, evidence } = body;

    if (!transactionId || !reason || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: transactionId, reason, description' },
        { status: 400 }
      );
    }

    // Call Payluk API with logging
    const data = await withApiLogging(
      '/dispute',
      'POST',
      async () => {
        const response = await fetch(`${PAYLUK_API_URL}/dispute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${PAYLUK_SECRET_KEY}`,
          },
          body: JSON.stringify({
            transactionId,
            reason,
            description,
            evidence: evidence || [],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Payluk API error: ${response.status}`);
        }

        return response.json();
      },
      { transactionId, requestBody: { transactionId, reason, description } }
    );

    // Track DISPUTED status in DB (non-blocking)
    trackStatusChange(
      transactionId,
      'DISPUTED',
      'buyer',
      `Dispute lodged: ${reason}`,
      data
    ).catch((e) => console.error('[dispute] DB status tracking failed:', e));

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating dispute:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// Made with Bob
