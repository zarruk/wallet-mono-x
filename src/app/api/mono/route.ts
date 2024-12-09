import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('=== PROXY REQUEST TO MONO API ===');
    console.log('Request Body:', body);

    const response = await fetch('https://api.sandbox.cuentamono.com/v1/ledger/account_holders', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
        'x-idempotency-key': request.headers.get('x-idempotency-key') || ''
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Body:', data);
    console.log('=== END PROXY REQUEST ===\n');

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json(
      { error: 'Error en el proxy' },
      { status: 500 }
    );
  }
} 