import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken, errorResponse } from '@/lib/auth';

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
 * POST /api/payluk/validate-session-token
 *
 * Validates a session token and returns the session data
 * Used by the hosted UI to authenticate iframe sessions
 * Does NOT require API key (token itself is the authentication)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { token } = body;

    // Validate token presence
    if (!token) {
      return errorResponse('Missing token', 400);
    }

    // Validate session token
    const result = validateSessionToken(token);

    if (!result.valid) {
      return errorResponse(result.error || 'Invalid session token', 401);
    }

    // Return session data with CORS headers
    return NextResponse.json({
      valid: true,
      data: result.data,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Nonce',
      },
    });
  } catch (error) {
    console.error('Validate session token error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to validate session token';
    return errorResponse(errorMessage, 500);
  }
}

// Made with Bob
