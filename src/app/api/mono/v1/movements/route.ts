import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const MONO_API_TOKEN = process.env.MONO_API_TOKEN_ACCOUNTS;
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');

    console.log('Movements Request:', {
      accountId,
      token: MONO_API_TOKEN?.substring(0, 10) + '...',
    });

    if (!accountId) {
      throw new Error('Account ID is required');
    }

    const url = `https://api.sandbox.cuentamono.com/v1/ledger/accounts/${accountId}/movements?page_size=10&page_number=1`;
    console.log('Movements URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${MONO_API_TOKEN}`,
      },
      cache: 'no-store'
    });

    const data = await response.json();
    console.log('Movements Response:', {
      status: response.status,
      data: JSON.stringify(data, null, 2)
    });

    if (!response.ok) {
      throw new Error(data.message || 'Error getting movements');
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Movements endpoint error:', error);
    console.error('Error details:', error.message);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
} 