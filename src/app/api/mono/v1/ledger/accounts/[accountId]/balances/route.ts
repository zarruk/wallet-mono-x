import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { accountId: string } }
) {
  try {
    const MONO_API_TOKEN_CARDS = process.env.MONO_API_TOKEN_CARDS;
    const timestamp = new Date().toISOString();
    
    console.log(`\n=== GET BALANCE API CALL (${timestamp}) ===`);
    console.log('Account ID:', params.accountId);
    
    const monoUrl = `https://api.sandbox.cuentamono.com/v1/ledger/accounts/${params.accountId}/balances`;
    console.log('URL:', monoUrl);
    
    console.log('Headers:', {
      'Accept': 'application/json',
      'Authorization': `Bearer ${MONO_API_TOKEN_CARDS?.substring(0, 10)}...`,
      'Cache-Control': 'no-cache'
    });

    const monoResponse = await fetch(monoUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${MONO_API_TOKEN_CARDS}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      cache: 'no-store'
    });

    const data = await monoResponse.json();
    
    console.log('Mono Response Status:', monoResponse.status);
    console.log('Mono Response Body:', JSON.stringify(data, null, 2));
    console.log(`=== END BALANCE API CALL (${timestamp}) ===\n`);

    return NextResponse.json(data, { 
      status: monoResponse.status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error: any) {
    console.error('Balance endpoint error:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
} 