import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const MONO_API_TOKEN = process.env.MONO_API_TOKEN;
    const { userData, cardholderData } = await request.json();
    const idempotencyKey = uuidv4();
    
    console.log('\n=== CREATE CARD API CALL ===');
    console.log('User Data:', userData);
    console.log('Cardholder Data:', cardholderData);
    
    const payload = {
      cardholder: {
        address: {
          city: "Bogota",
          country: "CO",
          line_1: "Calle 80 9 69",
          state: "Bogota",
          zip_code: "110111"
        },
        document: {
          person_type: "natural",
          type: "CC",
          country_code: "CO",
          number: userData.document_number
        },
        birthdate: userData.birth_date,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        nationality: "CO",
        phone_number: userData.phone
      },
      account_id: userData.mono_ledger_account_id,
      cardholder_id: cardholderData.id,
      configuration_group_id: "ccg_02yS5nPWCOcjZ0k6z5rThF",
      nickname: "Primera tarjeta"
    };

    console.log('Request Payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch('https://api.sandbox.cuentamono.com/v1/ledger/cards', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MONO_API_TOKEN}`,
        'x-idempotency-key': idempotencyKey
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.message || 'Error creating card');
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Card creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
} 