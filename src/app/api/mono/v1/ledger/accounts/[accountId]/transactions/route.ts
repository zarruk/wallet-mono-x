import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { accountId: string } }
) {
  try {
    const MONO_API_TOKEN = process.env.MONO_API_TOKEN;
    const timestamp = new Date().toISOString();
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    
    console.log(`\n=== GET TRANSACTIONS API CALL (${timestamp}) ===`);
    console.log('Account ID:', params.accountId);
    console.log('Page:', page);
    
    const monoUrl = `https://api.sandbox.cuentamono.com/v1/ledger/accounts/${params.accountId}/transactions?page_size=10&page_number=${page}`;
    console.log('URL:', monoUrl);
    
    console.log('Headers:', {
      'Accept': 'application/json',
      'Authorization': `Bearer ${MONO_API_TOKEN?.substring(0, 10)}...`,
      'Cache-Control': 'no-cache'
    });

    const monoResponse = await fetch(monoUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${MONO_API_TOKEN}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      cache: 'no-store'
    });

    const data = await monoResponse.json();
    
    console.log('Mono Response Status:', monoResponse.status);
    console.log('Mono Response Body:', JSON.stringify(data, null, 2));
    console.log(`=== END TRANSACTIONS API CALL (${timestamp}) ===\n`);

    if (!monoResponse.ok) {
      throw new Error(data.message || 'Error getting transactions from Mono');
    }

    return NextResponse.json(data, { 
      status: monoResponse.status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error: any) {
    console.error('Transactions endpoint error:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
} 