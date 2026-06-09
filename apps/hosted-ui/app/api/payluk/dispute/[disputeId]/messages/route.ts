import { NextRequest, NextResponse } from 'next/server';

const PAYLUK_API_URL = process.env.PAYLUK_API_URL || 'https://api.payluk.com/v1';
const PAYLUK_SECRET_KEY = process.env.PAYLUK_SECRET_KEY;

export async function GET(
  request: NextRequest,
  { params }: { params: { disputeId: string } }
) {
  try {
    const { disputeId } = params;

    if (!disputeId) {
      return NextResponse.json(
        { error: 'Dispute ID is required' },
        { status: 400 }
      );
    }

    // Call Payluk API to get dispute messages
    const response = await fetch(
      `${PAYLUK_API_URL}/dispute/${disputeId}/messages`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${PAYLUK_SECRET_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch messages' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching dispute messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Made with Bob
