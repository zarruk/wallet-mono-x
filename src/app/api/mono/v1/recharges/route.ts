import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const MONO_API_URL = 'https://api.sandbox.cuentamono.com/v1';

export async function POST(request: Request) {
  try {
    const { amount, userId, accountId } = await request.json();
    const idempotencyKey = uuidv4();
    const externalId = uuidv4();

    // Log para debug
    console.log('Token being used:', process.env.MONO_API_TOKEN_CARDS);
    console.log('Request URL:', `${MONO_API_URL}/ledger/accounts/${accountId}/balance`);

    const requestBody = {
      amount: {
        currency: "COP",
        amount: amount * 100 // Multiplicar por 100
      },
      operation: "topup",
      description: "Recarga vía PSE",
      external_id: externalId
    };

    console.log('Request body:', requestBody);

    const monoResponse = await fetch(`${MONO_API_URL}/ledger/accounts/${accountId}/balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.MONO_API_TOKEN_CARDS}`,
        'x-idempotency-key': idempotencyKey
      },
      body: JSON.stringify(requestBody)
    });

    // Log de la respuesta completa para debug
    const responseText = await monoResponse.text();
    console.log('Mono API Response:', {
      status: monoResponse.status,
      statusText: monoResponse.statusText,
      headers: Object.fromEntries(monoResponse.headers.entries()),
      body: responseText
    });

    if (!monoResponse.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { message: responseText };
      }
      console.error('Mono API error:', errorData);
      throw new Error(errorData.message || 'Error al procesar la recarga con Mono');
    }

    // Parsear la respuesta de Mono para obtener el ID de la transacción
    const monoData = JSON.parse(responseText);

    try {
      // Guardar en la tabla de transacciones
      await supabase
        .from('wallet_mono_ix_transactions')
        .insert({
          transaction_id: monoData.id,
          mono_ledger_account_id: accountId,
          amount: amount * 100, // Usar el mismo monto que enviamos a Mono
          operation: 'topup',
          status: 'success',
          external_id: externalId
        });
    } catch (dbError) {
      console.warn('Warning: Failed to save transaction to database:', dbError);
    }

    return NextResponse.json({
      success: true,
      message: 'Recarga exitosa'
    });

  } catch (error: any) {
    console.error('Error processing recharge:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Error al procesar la recarga',
        details: error.cause || error
      },
      { status: 500 }
    );
  }
} 