import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const MONO_API_TOKEN = process.env.MONO_API_TOKEN_CARDS;
    const timestamp = new Date().toISOString();
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');
    
    console.log(`\n=== GET CARDS API CALL (${timestamp}) ===`);
    console.log('Account ID:', accountId);
    
    const monoUrl = `https://api.sandbox.cuentamono.com/v1/cards?page_number=1&page_size=10&account_id=${accountId}&state=active&state=frozen`;
    console.log('URL:', monoUrl);
    
    console.log('Headers:', {
      'Accept': 'application/json',
      'Authorization': `Bearer ${MONO_API_TOKEN?.substring(0, 10)}...`,
    });

    console.log('\n=== CARDS API REQUEST ===');
    console.log('URL:', monoUrl);
    console.log('Headers:', {
      'Accept': 'application/json',
      'Authorization': 'Bearer [HIDDEN]',
    });

    const monoResponse = await fetch(monoUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${MONO_API_TOKEN}`,
      },
      cache: 'no-store'
    });

    const data = await monoResponse.json();
    
    console.log('\n=== CARDS API RESPONSE ===');
    console.log('Status:', monoResponse.status);
    console.log('Body:', JSON.stringify(data, null, 2));
    console.log(`=== END CARDS API CALL (${timestamp}) ===\n`);

    if (!monoResponse.ok) {
      throw new Error(data.message || 'Error getting cards from Mono');
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Cards endpoint error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
} 