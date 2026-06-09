import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, errorResponse, unauthorizedResponse } from '@/lib/auth';
import { confirmPayment } from '@/lib/paylukClient';
import { withApiLogging } from '@/lib/db/middleware/logger';
import { trackStatusChange } from '@/lib/db/middleware/statusTracker';

/**
 * POST /api/payluk/transactions/[transactionId]/release
 *
 * Buyer confirms receipt and releases payment to the seller.
 * Calls Payluk's confirm-payment endpoint, then tracks COMPLETED status in DB.
 *
 * Body: { buyerId: string }
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
    const { buyerId } = body;

    if (!buyerId) {
      return errorResponse('Missing required field: buyerId', 400);
    }

    // Call Payluk API with logging
    const result = await withApiLogging(
      `/escrow/confirm-payment/${transactionId}`,
      'POST',
      () => confirmPayment(transactionId, buyerId),
      { transactionId, requestBody: { buyerId } }
    );

    // Track status change in DB (non-blocking)
    trackStatusChange(
      transactionId,
      'COMPLETED',
      'buyer',
      'Buyer confirmed receipt and released payment',
      result
    ).catch((e) => console.error('[release] DB status tracking failed:', e));

    return NextResponse.json({
      success: true,
      message: 'Payment released successfully. Funds are being transferred to the seller.',
      data: result,
    });
  } catch (error) {
    console.error('Release payment error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to release payment';
    return errorResponse(errorMessage, 500);
  }
}

// Made with Bob