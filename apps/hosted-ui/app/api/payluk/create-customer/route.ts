import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, errorResponse, unauthorizedResponse } from '@/lib/auth';
import { createCustomer } from '@/lib/paylukClient';

/**
 * POST /api/payluk/create-customer
 * 
 * Creates a new customer in Payluk
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
    const { email, name, phone } = body;

    // Validate required fields
    if (!email || !name) {
      return errorResponse('Missing required fields: email, name', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse('Invalid email format', 400);
    }

    // Call Payluk API
    const result = await createCustomer({
      email,
      name,
      phone,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Create customer error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to create customer';
    return errorResponse(errorMessage, 500);
  }
}

// Made with Bob
