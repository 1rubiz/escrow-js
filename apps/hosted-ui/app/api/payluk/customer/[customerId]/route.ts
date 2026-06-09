import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from '@/lib/auth';

const PAYLUK_API_URL = process.env.PAYLUK_API_URL || 'https://staging.api.payluk.ng/v1';
const PAYLUK_SECRET_KEY = process.env.PAYLUK_SECRET_KEY;

/**
 * GET /api/payluk/customer/[customerId]
 *
 * Server-side proxy to Payluk's GET /v1/customer/get/{customer-id}.
 * Keeps PAYLUK_SECRET_KEY off the client.
 *
 * Response: { id, email, name }
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { customerId } = params;

    if (!customerId) {
      return errorResponse('Missing customerId', 400);
    }

    if (!PAYLUK_SECRET_KEY) {
      console.error('[customer proxy] PAYLUK_SECRET_KEY not configured');
      return errorResponse('Server configuration error', 500);
    }

    const upstream = await fetch(
      `${PAYLUK_API_URL}/customer/get/${customerId}`,
      {
        headers: {
          Authorization: `Bearer ${PAYLUK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    const data = await upstream.json();

    if (!upstream.ok || !data.status) {
      return errorResponse(
        data.message || 'Customer not found',
        upstream.ok ? 502 : upstream.status
      );
    }

    const { id, email, name } = data.data as { id: string; email: string; name: string };

    return NextResponse.json({ id, email, name });
  } catch (error) {
    console.error('[customer proxy] error:', error);
    return errorResponse('Failed to fetch customer information', 500);
  }
}

// Made with Bob
