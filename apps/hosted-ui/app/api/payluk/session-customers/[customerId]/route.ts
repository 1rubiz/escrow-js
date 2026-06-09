import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from '@/lib/auth';
import {
  getSessionCustomers,
  upsertSessionCustomer,
} from '@/lib/db/queries/customers';

/**
 * GET /api/payluk/session-customers/[customerId]
 *
 * Returns the participant history for the given owner (customerId).
 * Used by CreateTransactionForm to populate the recent-participants dropdown.
 *
 * Response: { data: SessionCustomer[] }
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

    const rows = await getSessionCustomers(customerId);

    // Reshape for the client — camelCase keys matching the SessionCustomer type used in the UI
    const data = rows.map((r) => ({
      participantPaylukId: r.participant_payluk_id,
      participantName: r.participant_name ?? null,
      participantEmail: r.participant_email ?? null,
      lastRole: r.last_role,
      transactionCount: r.transaction_count,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[session-customers GET] error:', error);
    return errorResponse('Failed to fetch participant history', 500);
  }
}

/**
 * POST /api/payluk/session-customers/[customerId]
 *
 * Records (or updates) a participant relationship for the given owner.
 * Called by CreateTransactionForm immediately after a transaction is created.
 *
 * Body:
 *   participantPaylukId  string   – the other party's Payluk customer ID
 *   participantName      string?  – display name (cached)
 *   participantEmail     string?  – email (cached)
 *   role                 'buyer' | 'seller' – role the participant played
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { customerId } = params;

    if (!customerId) {
      return errorResponse('Missing customerId', 400);
    }

    const body = await request.json();
    const { participantPaylukId, participantName, participantEmail, role } = body;

    if (!participantPaylukId || typeof participantPaylukId !== 'string') {
      return errorResponse('participantPaylukId is required', 400);
    }

    if (!role || !['buyer', 'seller'].includes(role)) {
      return errorResponse('role must be "buyer" or "seller"', 400);
    }

    await upsertSessionCustomer({
      ownerPaylukId: customerId,
      participantPaylukId,
      participantName: participantName ?? undefined,
      participantEmail: participantEmail ?? undefined,
      role,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[session-customers POST] error:', error);
    return errorResponse('Failed to record participant', 500);
  }
}

// Made with Bob
