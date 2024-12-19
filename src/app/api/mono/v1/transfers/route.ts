import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

const MONO_API_TOKEN = process.env.MONO_API_TOKEN_ACCOUNTS;
const MONO_API_TOKEN_CARDS = process.env.MONO_API_TOKEN_CARDS;

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const idempotencyKey = uuidv4();

    console.log('\n=== TRANSFER REQUEST DATA ===');
    console.log('User Data:', {
      userId: data.userId,
      accountId: data.accountId,
      amount: data.amount,
      bankCode: data.bankCode,
      accountType: data.accountType
    });

    // Crear registro en Supabase
    const { data: transferRecord, error: dbError } = await supabase
      .from('wallet_mono_ix_transfers')
      .insert({
        user_id: data.userId,
        amount: data.amount,
        bank_code: data.bankCode,
        account_type: data.accountType,
        account_number: data.accountNumber,
        recipient_document_type: data.documentType,
        recipient_document_number: data.documentNumber,
        recipient_name: data.recipientName,
        recipient_phone: data.phoneNumber,
        description: data.description,
        status: 'pending'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Supabase Error:', dbError);
      throw dbError;
    }

    console.log('\n=== SUPABASE TRANSFER RECORD ===');
    console.log(JSON.stringify(transferRecord, null, 2));

    // Realizar la transferencia
    const monoPayload = {
      transfers: [
        {
          amount: {
            currency: "COP",
            amount: data.amount
          },
          fallback_routing: ["ach"],
          payee: {
            bank_account: {
              type: data.accountType,
              bank_code: data.bankCode,
              number: data.accountNumber
            },
            document_type: data.documentType,
            document_number: data.documentNumber,
            name: data.recipientName,
            phone_number: data.phoneNumber
          },
          routing: "turbo",
          description: data.description,
          entity_id: transferRecord.id
        }
      ],
      account_id: "acc_02yS6Xfey3sWWvvNAJtie6"
    };

    console.log('\n=== MONO TRANSFER REQUEST ===');
    console.log('URL: https://api.sandbox.cuentamono.com/v1/transfers');
    console.log('Headers:', {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ****',
      'x-idempotency-key': idempotencyKey
    });
    console.log('Payload:', JSON.stringify(monoPayload, null, 2));

    const monoResponse = await fetch('https://api.sandbox.cuentamono.com/v1/transfers', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MONO_API_TOKEN}`,
        'x-idempotency-key': idempotencyKey
      },
      body: JSON.stringify(monoPayload)
    });

    const monoData = await monoResponse.json();
    console.log('\n=== MONO TRANSFER RESPONSE ===');
    console.log('Status:', monoResponse.status);
    console.log('Data:', JSON.stringify(monoData, null, 2));

    if (!monoResponse.ok) {
      await supabase
        .from('wallet_mono_ix_transfers')
        .update({ 
          status: 'failed',
          mono_transfer_id: monoData.id || null
        })
        .eq('id', transferRecord.id);

      throw new Error(monoData.message || 'Error al procesar la transferencia');
    }

    // Si la transferencia fue exitosa, realizar el débito
    const withdrawalId = uuidv4();
    const withdrawalPayload = {
      amount: {
        currency: "COP",
        amount: data.amount
      },
      operation: "withdrawal",
      external_id: withdrawalId,
      description: `Retiro por transferencia a ${data.recipientName}`
    };

    console.log('\n=== MONO WITHDRAWAL REQUEST ===');
    console.log(`URL: https://api.sandbox.cuentamono.com/v1/ledger/accounts/${data.accountId}/balance`);
    console.log('Payload:', JSON.stringify(withdrawalPayload, null, 2));

    const withdrawalResponse = await fetch(
      `https://api.sandbox.cuentamono.com/v1/ledger/accounts/${data.accountId}/balance`, 
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MONO_API_TOKEN_CARDS}`,
          'x-idempotency-key': uuidv4()
        },
        body: JSON.stringify(withdrawalPayload)
      }
    );

    const withdrawalData = await withdrawalResponse.json();
    console.log('\n=== MONO WITHDRAWAL RESPONSE ===');
    console.log('Status:', withdrawalResponse.status);
    console.log('Data:', JSON.stringify(withdrawalData, null, 2));

    if (!withdrawalResponse.ok) {
      console.error('\n=== WARNING: Transfer successful but withdrawal failed ===');
      console.error('Transfer ID:', monoData.transfers[0].id);
      console.error('Withdrawal Error:', withdrawalData);
    }

    // Actualizar el registro con los IDs de transferencia y débito
    const { error: updateError } = await supabase
      .from('wallet_mono_ix_transfers')
      .update({ 
        status: 'completed',
        mono_transfer_id: monoData.transfers[0].id,
        mono_withdrawal_id: withdrawalResponse.ok ? withdrawalData.id : null
      })
      .eq('id', transferRecord.id);

    if (updateError) {
      console.error('Error updating transfer record:', updateError);
    }

    return NextResponse.json(monoData);
  } catch (error: any) {
    console.error('\n=== TRANSFER ERROR ===');
    console.error(error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 