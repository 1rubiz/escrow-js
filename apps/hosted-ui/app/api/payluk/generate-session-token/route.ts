import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, generateSessionToken, errorResponse, unauthorizedResponse } from '@/lib/auth';

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Nonce',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * POST /api/payluk/generate-session-token
 *
 * Generates a session token for the hosted UI iframe.
 * Requires API key authentication.
 *
 * Body (all optional except customerId):
 *   customerId   string  – the caller's own Payluk customer ID (required)
 *   participantId string – the other party's Payluk customer ID
 *   isSeller     boolean – true = caller is seller; triggers transaction field validation
 *   amount       number  – required when isSeller + participantId present
 *   currency     string  – 3-letter ISO code, required when isSeller + participantId present
 *   name         string  – item name, required when isSeller + participantId present
 *   description  string  – required when isSeller + participantId present
 *   conditions   string[]
 *   metadata     object
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
      participantId,
      isSeller,
      amount,
      currency,
      name,
      description,
      conditions,
      metadata,
    } = body;

    // customerId is always required
    if (!customerId || typeof customerId !== 'string') {
      return errorResponse('Missing required field: customerId', 400);
    }

    // When isSeller + participantId are both present, transaction fields are required
    if (isSeller !== undefined && participantId) {
      if (typeof amount !== 'number' || amount <= 0) {
        return errorResponse(
          'amount is required and must be a positive number when isSeller and participantId are provided',
          400
        );
      }
      if (!currency || typeof currency !== 'string' || currency.length !== 3) {
        return errorResponse(
          'currency must be a 3-letter ISO code when isSeller and participantId are provided',
          400
        );
      }
      if (!name || typeof name !== 'string') {
        return errorResponse(
          'name is required when isSeller and participantId are provided',
          400
        );
      }
      if (!description || typeof description !== 'string') {
        return errorResponse(
          'description is required when isSeller and participantId are provided',
          400
        );
      }
    }

    // Validate conditions if provided
    if (conditions !== undefined && (!Array.isArray(conditions) || conditions.length === 0)) {
      return errorResponse('conditions must be a non-empty array when provided', 400);
    }

    // Generate session token
    const token = generateSessionToken({
      customerId,
      ...(participantId && { participantId }),
      ...(isSeller !== undefined && { isSeller }),
      ...(amount !== undefined && { amount }),
      ...(currency && { currency }),
      ...(name && { name }),
      ...(description && { description }),
      ...(conditions && { conditions }),
      metadata: metadata || {},
    });

    return NextResponse.json(
      { token, expiresIn: 1800 },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Nonce',
        },
      }
    );
  } catch (error) {
    console.error('Generate session token error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate session token';
    return errorResponse(errorMessage, 500);
  }
}

// Made with Bob
