'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const userSchema = z.object({
  first_name: z.string().min(1, 'El nombre es requerido'),
  last_name: z.string().min(1, 'Los apellidos son requeridos'),
  company_name: z.string().min(1, 'El nombre de la empresa es requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'El teléfono es requerido'),
  document_number: z.string().min(1, 'El número de documento es requerido'),
  initial_balance: z.coerce.number().int().min(0),
  company_logo_url: z.string().url().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

export default function CreateUserPage() {
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<UserFormData>({
    resolver: zodResolver(userSchema)
  });

  const onSubmit = async (data: UserFormData) => {
    try {
      const { error } = await supabase
        .from('wallet_mono_ix_users')
        .insert([{
          first_name: data.first_name,
          last_name: data.last_name,
          company_name: data.company_name,
          email: data.email,
          phone: data.phone,
          document_number: data.document_number,
          initial_balance: data.initial_balance,
          company_logo_url: data.company_logo_url,
          password_hash: null
        }]);

      if (error) throw error;

      setMessage({ 
        type: 'success', 
        text: 'Usuario creado exitosamente. El usuario podrá establecer su contraseña al registrarse.' 
      });
      reset();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  return (
    <div className="min-h-screen bg-mono-dark">
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold text-white">Crear Nuevo Cliente</h1>
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-300">
                Nombre
              </label>
              <input
                {...register('first_name')}
                className="w-full px-4 py-3 bg-mono-gray border-0 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-mono-purple"
                placeholder="Juan"
              />
              {errors.first_name && (
                <p className="mt-2 text-sm text-red-400">{errors.first_name.message}</p>
              )}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-300">
                Apellidos
              </label>
              <input
                {...register('last_name')}
                className="w-full px-4 py-3 bg-mono-gray border-0 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-mono-purple"
                placeholder="Pérez"
              />
              {errors.last_name && (
                <p className="mt-2 text-sm text-red-400">{errors.last_name.message}</p>
              )}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-300">
                Número de Documento
              </label>
              <input
                type="text"
                {...register('document_number')}
                className="w-full px-4 py-3 bg-mono-gray border-0 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-mono-purple"
                placeholder="Número de documento"
              />
              {errors.document_number && (
                <p className="mt-2 text-sm text-red-400">{errors.document_number.message}</p>
              )}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-300">
                Empresa
              </label>
              <input
                {...register('company_name')}
                className="w-full px-4 py-3 bg-mono-gray border-0 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-mono-purple"
                placeholder="Empresa S.A."
              />
              {errors.company_name && (
                <p className="mt-2 text-sm text-red-400">{errors.company_name.message}</p>
              )}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-300">
                Correo electrónico
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-4 py-3 bg-mono-gray border-0 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-mono-purple"
                placeholder="correo@empresa.com"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-300">
                Teléfono
              </label>
              <input
                type="tel"
                {...register('phone')}
                className="w-full px-4 py-3 bg-mono-gray border-0 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-mono-purple"
                placeholder="+573001234567"
                defaultValue="+57"
              />
              {errors.phone && (
                <p className="mt-2 text-sm text-red-400">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-300">
                Saldo inicial
              </label>
              <input
                type="number"
                {...register('initial_balance')}
                className="w-full px-4 py-3 bg-mono-gray border-0 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-mono-purple"
                placeholder="0"
              />
              {errors.initial_balance && (
                <p className="mt-2 text-sm text-red-400">{errors.initial_balance.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 text-sm font-medium text-gray-300">
                URL del logo (opcional)
              </label>
              <input
                type="url"
                {...register('company_logo_url')}
                className="w-full px-4 py-3 bg-mono-gray border-0 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-mono-purple"
                placeholder="https://ejemplo.com/logo.png"
              />
              {errors.company_logo_url && (
                <p className="mt-2 text-sm text-red-400">{errors.company_logo_url.message}</p>
              )}
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3 bg-mono-purple text-white rounded-xl hover:bg-opacity-90 transition-all"
            >
              Crear Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 