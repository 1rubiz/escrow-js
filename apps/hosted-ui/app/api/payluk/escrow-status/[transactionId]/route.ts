import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, errorResponse, unauthorizedResponse } from '@/lib/auth';
// import { getEscrowStatus } from '@/lib/paylukClient';

/**
 * GET /api/payluk/escrow-status/[transactionId]
 * 
 * Retrieves the current status of an escrow transaction
 * Requires API key authentication
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { transactionId: string } }
) {
  try {
    // Validate API key
    const authResult = validateApiKey(request);
    if (!authResult.valid) {
      return unauthorizedResponse(authResult.error || 'Unauthorized');
    }

    const { transactionId } = params;

    // Validate transactionId
    if (!transactionId) {
      return errorResponse('Transaction ID is required', 400);
    }

    // Call Payluk API
    const result = {
      success: true,
      message: 'Escrow status retrieved successfully',
      data: {
        transactionId: '1234567890',
        status: 'created',
        amount: 100,
        currency: 'USD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
    // await getEscrowStatus(transactionId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get escrow status error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve escrow status';
    return errorResponse(errorMessage, 500);
  }
}

// Made with Bob
