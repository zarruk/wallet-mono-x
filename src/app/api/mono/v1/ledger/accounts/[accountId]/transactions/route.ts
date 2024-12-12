import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { accountId: string } }
) {
  try {
    const MONO_API_TOKEN = process.env.MONO_API_TOKEN_CARDS;
    const { searchParams } = new URL(request.url);
    const pageNumber = searchParams.get('page_number') || '1';
    const pageSize = searchParams.get('page_size') || '10';
    const { accountId } = params;

    console.log('=== GET TRANSACTIONS API CALL ===');
    console.log('Account ID:', accountId);
    console.log('Page:', pageNumber);

    const url = `https://api.sandbox.cuentamono.com/v1/ledger/accounts/${accountId}/transactions?page_size=${pageSize}&page_number=${pageNumber}&sort[field]=transaction_at&sort[type]=desc`;
    console.log('URL:', url);
    console.log('Headers:', {
      'Accept': 'application/json',
      'Authorization': `Bearer ${MONO_API_TOKEN?.substring(0, 10)}...`,
      'Cache-Control': 'no-cache'
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${MONO_API_TOKEN}`,
        'Cache-Control': 'no-cache'
      }
    });

    const data = await response.json();

    console.log('Mono Response Status:', response.status);
    console.log('Mono Response Body:', JSON.stringify(data, null, 2));
    console.log('=== END TRANSACTIONS API CALL ===\n');

    if (!response.ok) {
      throw new Error(data.message || data.errors?.detail || 'Error getting transactions');
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Transactions endpoint error:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
} 