import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { cardId: string } }
) {
  try {
    const MONO_API_TOKEN = process.env.MONO_API_TOKEN_CARDS;
    const { cardId } = params;

    if (!cardId) {
      throw new Error('Malformed request');
    }

    const response = await fetch(
      `https://api.sandbox.cuentamono.com/v1/cards/${cardId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${MONO_API_TOKEN}`,
        },
        cache: 'no-store'
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error getting card details');
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Card details error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
} 