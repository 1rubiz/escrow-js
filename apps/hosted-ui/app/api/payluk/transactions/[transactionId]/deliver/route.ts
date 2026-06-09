import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, errorResponse, unauthorizedResponse } from '@/lib/auth';
import { claimFunds } from '@/lib/paylukClient';
import { withApiLogging } from '@/lib/db/middleware/logger';
import { trackStatusChange } from '@/lib/db/middleware/statusTracker';

/**
 * POST /api/payluk/transactions/[transactionId]/deliver
 *
 * Seller marks delivery complete and requests fund release (claim).
 * Calls Payluk's claim-funds endpoint, then tracks the CLAIMED status in DB.
 *
 * Body: { paymentToken: string; sellerId: string }
 * Requires API key authentication.
 */
export async function POST(
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

    const body = await request.json();
    const { paymentToken, sellerId } = body;

    if (!paymentToken || !sellerId) {
      return errorResponse('Missing required fields: paymentToken, sellerId', 400);
    }

    // Call Payluk API with logging
    const result = await withApiLogging(
      `/escrow/claim-funds/${paymentToken}`,
      'GET',
      () => claimFunds(paymentToken, sellerId),
      { transactionId, requestBody: { paymentToken, sellerId } }
    );

    // Track status change in DB (non-blocking, errors are swallowed)
    trackStatusChange(
      transactionId,
      'CLAIMED',
      'seller',
      'Seller marked as delivered and requested fund release',
      result
    ).catch((e) => console.error('[deliver] DB status tracking failed:', e));

    return NextResponse.json({
      success: true,
      message: 'Delivery marked — funds claim initiated. Buyer has 24 hours to dispute.',
      data: result,
    });
  } catch (error) {
    console.error('Mark as delivered error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to mark as delivered';
    return errorResponse(errorMessage, 500);
  }
}

// Made with Bob