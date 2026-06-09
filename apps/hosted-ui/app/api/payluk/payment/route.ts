import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, errorResponse, unauthorizedResponse } from '@/lib/auth';
import { makeEscrowPayment } from '@/lib/paylukClient';

/**
 * POST /api/payluk/payment
 *
 * Initiates escrow payment for a transaction
 * Requires API key authentication
 *
 * Note: This uses the direct API method. For frontend implementations,
 * consider using the SDK method (useEscrowCheckout) which is cleaner.
 */
export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const authResult = validateApiKey(request);
    if (!authResult.valid) {
      return unauthorizedResponse(authResult.error || 'Unauthorized');
    }

    // Parse request body
    const body = await request.json();
    const {
      customerId,
      amount,
      reference,
      gateway,
      cardId,
      escrowDetails
    } = body;

    // Validate required fields
    if (!customerId || !amount || !reference || !gateway || !escrowDetails?.paymentToken) {
      return errorResponse(
        'Missing required fields: customerId, amount, reference, gateway, escrowDetails.paymentToken',
        400
      );
    }

    // Validate gateway type
    if (gateway !== 'card' && gateway !== 'wallet') {
      return errorResponse('Invalid gateway. Must be "card" or "wallet"', 400);
    }

    // If gateway is card, cardId might be required (for saved cards)
    if (gateway === 'card' && cardId === undefined) {
      // cardId is optional, but log a warning
      console.warn('Payment with card gateway but no cardId provided');
    }

    // Call Payluk API
    const result = await makeEscrowPayment({
      customerId,
      amount,
      reference,
      gateway,
      transactionType: 'escrow',
      ...(cardId && { cardId }),
      escrowDetails,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Escrow payment error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to process escrow payment';
    return errorResponse(errorMessage, 500);
  }
}

// Made with Bob
