import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { accountId: string } }
) {
  try {
    console.log('=== BALANCE ENDPOINT CALLED ===');
    console.log('Account ID:', params.accountId);
    
    const body = await request.json();
    console.log('Request Body:', JSON.stringify(body, null, 2));

    const MONO_API_TOKEN_CARDS = process.env.MONO_API_TOKEN_CARDS;

    console.log('Making request to Mono API...');
    const response = await fetch(
      `https://api.sandbox.cuentamono.com/v1/ledger/accounts/${params.accountId}/balance`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MONO_API_TOKEN_CARDS}`,
          'x-idempotency-key': crypto.randomUUID()
        },
        body: JSON.stringify(body)
      }
    );

    const data = await response.json();
    console.log('Mono API Response:', {
      status: response.status,
      data: JSON.stringify(data, null, 2)
    });

    if (!response.ok) {
      console.log('Error response from Mono:', data);
      throw new Error(data.message || 'Error processing balance operation');
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Balance endpoint error:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
} 