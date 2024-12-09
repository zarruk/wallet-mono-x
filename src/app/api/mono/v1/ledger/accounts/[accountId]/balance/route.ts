import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { accountId: string } }
) {
  try {
    const body = await request.json();
    console.log('\n=== BALANCE ENDPOINT CALLED ===');
    console.log('Account ID:', params.accountId);
    console.log('Request Body:', JSON.stringify(body, null, 2));

    const MONO_API_TOKEN = process.env.MONO_API_TOKEN;
    if (!MONO_API_TOKEN) {
      console.error('MONO_API_TOKEN not found in environment variables');
      throw new Error('Configuration error');
    }

    console.log('Making request to Mono API...');
    const monoResponse = await fetch(
      `https://api.sandbox.cuentamono.com/v1/ledger/accounts/${params.accountId}/balance`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MONO_API_TOKEN}`,
          'x-idempotency-key': request.headers.get('x-idempotency-key') || '',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await monoResponse.json();
    console.log('Mono API Response:', {
      status: monoResponse.status,
      data: JSON.stringify(data, null, 2)
    });

    if (!monoResponse.ok) {
      console.error('Error response from Mono:', data);
      throw new Error(data.message || 'Error from Mono API');
    }

    return NextResponse.json(data, { status: monoResponse.status });
  } catch (error: any) {
    console.error('Balance endpoint error:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
} 