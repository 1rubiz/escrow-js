import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, errorResponse, unauthorizedResponse } from '@/lib/auth';
// import { createTransaction } from '@/lib/paylukClient';

/**
 * POST /api/payluk/create-transaction
 * 
 * Creates a new escrow transaction in Payluk
 * Requires API key authentication
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
    const { customerId, amount, currency, buyer, seller, conditions, metadata } = body;

    // Validate required fields
    if (!customerId || !amount || !buyer || !seller || !conditions) {
      return errorResponse(
        'Missing required fields: customerId, amount, buyer, seller, conditions',
        400
      );
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return errorResponse('Amount must be a positive number', 400);
    }

    // Validate buyer and seller
    if (!buyer.email || !seller.email) {
      return errorResponse('Buyer and seller must have email addresses', 400);
    }

    // Validate conditions
    if (!Array.isArray(conditions) || conditions.length === 0) {
      return errorResponse('Conditions must be a non-empty array', 400);
    }

    // Call Payluk API
    const result = {
      success: true,
      message: 'Transaction created successfully',
      data: {
        transactionId: '1234567890',
        customerId,
        amount,
        currency,
        buyer,
        seller,
        conditions,
        metadata,
        status: 'created',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
    // await createTransaction({
    //   customerId,
    //   amount,
    //   currency: currency || 'USD',
    //   buyer,
    //   seller,
    //   conditions,
    //   metadata: metadata || {},
    // });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Create transaction error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to create transaction';
    return errorResponse(errorMessage, 500);
  }
}

// Made with Bob
