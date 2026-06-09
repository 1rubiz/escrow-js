import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, errorResponse, unauthorizedResponse } from '@/lib/auth';
import { getWallet } from '@/lib/paylukClient';

/**
 * GET /api/payluk/wallet/[customerId]
 * 
 * Retrieves wallet information for a customer
 * Requires API key authentication
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    // Validate API key
    const authResult = validateApiKey(request);
    if (!authResult.valid) {
      return unauthorizedResponse(authResult.error || 'Unauthorized');
    }

    const { customerId } = params;

    // Validate customerId
    if (!customerId) {
      return errorResponse('Customer ID is required', 400);
    }

    // Call Payluk API
    const result = await getWallet(customerId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get wallet error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve wallet';
    return errorResponse(errorMessage, 500);
  }
}

// Made with Bob
