import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

interface CardholderRequest {
  userData: {
    // ... otros campos
  };
  birthDate: string;
  nickname: string;
}

export async function POST(request: Request) {
  try {
    const MONO_API_TOKEN = process.env.MONO_API_TOKEN;
    const { userData, birthDate, nickname } = await request.json();
    const idempotencyKey = uuidv4();
    
    console.log('\n=== CREATE CARDHOLDER API CALL ===');
    console.log('User Data:', userData);
    console.log('Birth Date:', birthDate);
    
    // Validar que tenemos todos los campos necesarios
    if (!userData.email || !userData.document_number || !userData.phone || 
        !userData.first_name || !userData.last_name) {
      throw new Error('Faltan datos del usuario necesarios para crear el cardholder');
    }

    const cardholderPayload = {
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
      birthdate: birthDate,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      nationality: "CO",
      phone_number: userData.phone
    };

    console.log('Cardholder Request Payload:', JSON.stringify(cardholderPayload, null, 2));
    
    const response = await fetch('https://api.sandbox.cuentamono.com/v1/cards/cardholders', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MONO_API_TOKEN}`,
        'x-idempotency-key': idempotencyKey
      },
      body: JSON.stringify(cardholderPayload)
    });

    const cardholderData = await response.json();
    console.log('Cardholder Response:', JSON.stringify(cardholderData, null, 2));

    if (!response.ok) {
      throw new Error(cardholderData.message || 'Error creating cardholder');
    }

    // Actualizar la base de datos con el cardholder_id y birth_date
    const { error: updateError } = await supabase
      .from('wallet_mono_ix_users')
      .update({
        cardholder_id: cardholderData.id,
        birth_date: birthDate
      })
      .eq('id', userData.id);

    if (updateError) {
      throw updateError;
    }

    // Crear la tarjeta
    const cardPayload = {
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
        birthdate: birthDate,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        nationality: "CO",
        phone_number: userData.phone
      },
      account_id: userData.mono_ledger_account_id,
      cardholder_id: cardholderData.id,
      configuration_group_id: "ccg_02yS5nPWCOcjZ0k6z5rThF",
      nickname: nickname
    };

    console.log('\n=== CREATE CARD API CALL ===');
    console.log('Card Request Payload:', JSON.stringify(cardPayload, null, 2));

    const cardResponse = await fetch('https://api.sandbox.cuentamono.com/v1/ledger/cards', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MONO_API_TOKEN}`,
        'x-idempotency-key': uuidv4()
      },
      body: JSON.stringify(cardPayload)
    });

    const cardData = await cardResponse.json();
    console.log('Card Response:', JSON.stringify(cardData, null, 2));

    if (!cardResponse.ok) {
      throw new Error(cardData.message || 'Error creating card');
    }

    return NextResponse.json({ cardholderData, cardData });
  } catch (error: any) {
    console.error('Card/Cardholder creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
} 