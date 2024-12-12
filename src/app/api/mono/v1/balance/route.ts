import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const MONO_API_TOKEN = process.env.MONO_API_TOKEN_CARDS;
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');

    console.log('Balance Request:', {
      accountId,
      token: MONO_API_TOKEN?.substring(0, 10) + '...',
      url: `https://api.sandbox.cuentamono.com/v1/ledger/accounts/${accountId}/balances`
    });

    if (!accountId) {
      throw new Error('Account ID is required');
    }

    const response = await fetch(
      `https://api.sandbox.cuentamono.com/v1/ledger/accounts/${accountId}/balances`,
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
    console.log('Balance API Response:', {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data: JSON.stringify(data, null, 2)
    });

    if (!response.ok) {
      throw new Error(data.message || data.errors?.detail || 'Error getting balance');
    }

    return NextResponse.json({
      available: Number(data.available?.amount || 0),
      currency: data.available?.currency || 'COP'
    });
  } catch (error: any) {
    console.error('Balance endpoint error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error', available: 0 },
      { status: 500 }
    );
  }
}
