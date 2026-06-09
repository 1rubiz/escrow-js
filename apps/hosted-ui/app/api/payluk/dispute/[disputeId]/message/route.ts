import { NextRequest, NextResponse } from 'next/server';

const PAYLUK_API_URL = process.env.PAYLUK_API_URL || 'https://api.payluk.com/v1';
const PAYLUK_SECRET_KEY = process.env.PAYLUK_SECRET_KEY;

export async function POST(
  request: NextRequest,
  { params }: { params: { disputeId: string } }
) {
  try {
    const { disputeId } = params;
    const body = await request.json();
    const { message } = body;

    if (!disputeId) {
      return NextResponse.json(
        { error: 'Dispute ID is required' },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Call Payluk API to send message
    const response = await fetch(
      `${PAYLUK_API_URL}/dispute/${disputeId}/message`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${PAYLUK_SECRET_KEY}`,
        },
        body: JSON.stringify({ message: message.trim() }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to send message' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error sending dispute message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Made with Bob
