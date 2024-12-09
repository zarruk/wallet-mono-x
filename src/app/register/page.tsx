'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

async function createTransactionAndTopup(
  ledgerAccountData: any,
  userData: any
) {
  console.log('\n=== Starting Transaction and Topup Process ===');
  console.log('Ledger Account Data:', ledgerAccountData);
  console.log('User Data:', userData);

  const transactionId = uuidv4();
  
  try {
    // 1. Crear la transacción
    console.log('Creating transaction record in Supabase...');
    const { error: transactionError } = await supabase
      .from('wallet_mono_ix_transactions')
      .insert({
        mono_ledger_account_id: ledgerAccountData.id,
        amount: userData.initial_balance,
        operation: 'topup',
        status: 'pending',
        external_id: transactionId
      });

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      throw transactionError;
    }

    console.log('Transaction record created successfully');

    // 2. Hacer la recarga
    console.log('Initiating balance topup...');
    const balanceResponse = await fetch(`/api/mono/v1/ledger/accounts/${ledgerAccountData.id}/balance`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-idempotency-key': uuidv4()
      },
      body: JSON.stringify({
        amount: {
          currency: 'COP',
          amount: (userData.initial_balance * 100).toString()
        },
        operation: 'topup',
        external_id: transactionId
      })
    });

    console.log('Balance response received:', {
      status: balanceResponse.status
    });

    const balanceData = await balanceResponse.json();
    console.log('Balance data:', balanceData);
    
    if (!balanceResponse.ok) {
      console.error('Error in balance response:', balanceData);
      // Actualizar estado de la transacción a fallida
      await supabase
        .from('wallet_mono_ix_transactions')
        .update({ status: 'failed' })
        .eq('external_id', transactionId);
      
      throw new Error(balanceData.message || 'Error al abonar el saldo inicial');
    }

    console.log('Balance topup successful');

    // Actualizar estado de la transacción a exitosa
    await supabase
      .from('wallet_mono_ix_transactions')
      .update({ status: 'success' })
      .eq('external_id', transactionId);

    console.log('Transaction status updated to success');
    return balanceData;
  } catch (error) {
    console.error('Error in createTransactionAndTopup:', error);
    throw error;
  }
}

export default function RegisterPage() {
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      console.log('Iniciando proceso de registro');

      // 1. Verificar si el usuario existe y no tiene contraseña
      console.log('Verificando usuario en la base de datos...');
      const { data: userData, error: userError } = await supabase
        .from('wallet_mono_ix_users')
        .select('id, first_name, last_name, company_name, document_number, phone, initial_balance')
        .eq('email', data.email)
        .is('password_hash', null)
        .single();

      if (userError || !userData) {
        console.error('Error al obtener usuario:', userError);
        throw new Error('No existe un usuario registrado con este correo electrónico o ya tiene una cuenta activa');
      }

      console.log('Datos del usuario obtenidos:', userData);

      if (!userData.first_name || !userData.last_name) {
        throw new Error('Los datos del usuario están incompletos. Contacte al administrador.');
      }

      console.log('\n=== DATOS PARA ABONO INICIAL ===');
      console.log('userData completo:', userData);
      console.log('initial_balance:', userData.initial_balance);
      console.log('Tipo de initial_balance:', typeof userData.initial_balance);

      // 2. Llamada a la API de Mono para crear el accountHolder
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-idempotency-key': uuidv4(),
      };

      const requestBody = {
        address: {
          city: "Bogota",
          country: "CO",
          line_1: "Calle 80 9 69",
          state: "Bogota",
          zip_code: "110111"
        },
        metadata: {
          empresa: userData.company_name
        },
        person: {
          document_type: "CC",
          person_type: "legal",
          country_code: "CO",
          document_number: userData.document_number,
          first_name: userData.first_name,
          last_name: userData.last_name
        },
        email: data.email,
        external_id: userData.id,
        phone_number: userData.phone,
        person_id: `CC-${userData.document_number}-${Date.now()}`
      };

      console.log('Request Body:', requestBody);

      console.log('\nEnviando petición a Mono (Account Holder)...');
      const accountHolderResponse = await fetch('/api/mono/v1/ledger/account_holders', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      const accountHolderData = await accountHolderResponse.json();

      if (!accountHolderResponse.ok) {
        throw new Error(accountHolderData.message || 'Error al crear el account holder');
      }

      console.log('\nRespuesta exitosa de Mono (Account Holder):', accountHolderData);

      // 3. Crear ledger account
      console.log('\n=== INICIANDO CREACIÓN DE LEDGER ACCOUNT ===');
      console.log('Account Holder ID:', accountHolderData.id);

      const ledgerAccountResponse = await fetch('/api/mono/v1/ledger/accounts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          currency_code: 'COP',
          holder_id: accountHolderData.id,
          name: `Cuenta de ${userData.first_name} ${userData.last_name}, empresa ${userData.company_name}`
        })
      });

      const ledgerAccountData = await ledgerAccountResponse.json();

      if (!ledgerAccountResponse.ok) {
        console.error('Error al crear ledger account:', ledgerAccountData);
        throw new Error(ledgerAccountData.message || 'Error al crear la cuenta en el ledger');
      }

      console.log('Ledger Account creada exitosamente:', ledgerAccountData);

      // Crear transacción y hacer recarga
      await createTransactionAndTopup(ledgerAccountData, userData);

      // 4. Actualizar el usuario en Supabase
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const { error: updateError } = await supabase
        .from('wallet_mono_ix_users')
        .update({
          password_hash: hashedPassword,
          mono_account_id: accountHolderData.id,
          mono_ledger_account_id: ledgerAccountData.id
        })
        .eq('id', userData.id);

      if (updateError) {
        console.error('Error actualizando usuario:', updateError);
        throw updateError;
      }

      setMessage({ 
        type: 'success', 
        text: 'Cuenta creada exitosamente. Ya puedes iniciar sesión.' 
      });

      console.log('Proceso de registro completado exitosamente');
    } catch (error: any) {
      console.error('Error en el proceso de registro:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Error al crear la cuenta. Intenta nuevamente más tarde.'
      });
    }
  };

  return (
    <div className="min-h-screen bg-mono-dark">
      <div className="max-w-md mx-auto px-8 py-12">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold text-white">Registro</h1>
          <Link 
            href="/"
            className="text-gray-300 hover:text-mono-purple transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
        
        {message && (
          <div className={`p-4 mb-8 rounded-xl ${
            message.type === 'success' 
              ? 'bg-mono-purple/10 text-mono-purple border border-mono-purple/20' 
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">
              Correo electrónico
            </label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-4 py-3 bg-mono-gray border-0 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-mono-purple"
              placeholder="correo@ejemplo.com"
            />
            {errors.email && (
              <p className="mt-2 text-sm text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">
              Contraseña
            </label>
            <input
              type="password"
              {...register('password')}
              className="w-full px-4 py-3 bg-mono-gray border-0 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-mono-purple"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-2 text-sm text-red-400">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              {...register('confirmPassword')}
              className="w-full px-4 py-3 bg-mono-gray border-0 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-mono-purple"
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="mt-2 text-sm text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-mono-purple text-white rounded-xl hover:bg-opacity-90 transition-all"
          >
            Crear cuenta
          </button>

          <p className="text-center text-gray-400">
            ¿Ya tienes cuenta?{' '}
            <Link 
              href="/login" 
              className="text-mono-purple hover:text-mono-pink transition-colors"
            >
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
  