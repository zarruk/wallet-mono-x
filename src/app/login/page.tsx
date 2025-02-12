'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import bcrypt from 'bcryptjs';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setMessage({ type: 'success', text: 'Verificando credenciales...' });

      const { data: userData, error: userError } = await supabase
        .from('wallet_mono_ix_users')
        .select('*')
        .eq('email', data.email)
        .single();

      if (userError || !userData) {
        console.error('User error:', userError);
        throw new Error('Credenciales inválidas');
      }

      const passwordMatch = await bcrypt.compare(data.password, userData.password_hash);

      if (!passwordMatch) {
        throw new Error('Credenciales inválidas');
      }

      const session = {
        user: {
          id: userData.id,
          email: userData.email,
          user_metadata: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            company_name: userData.company_name
          }
        },
        expires_at: Date.now() + (24 * 60 * 60 * 1000)
      };

      localStorage.setItem('userSession', JSON.stringify(session));
      localStorage.setItem('userEmail', userData.email);

      setMessage({ type: 'success', text: 'Inicio de sesión exitoso' });

      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error('Login error:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mpf-beige flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-mpf-dark mb-2">Mono Wallet</h1>
          <p className="text-gray-500">Inicia sesión para continuar</p>
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

        <div className="bg-white/70 backdrop-blur-sm shadow-lg rounded-2xl p-8 border border-gray-100/20">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-gray-500 mb-2 text-sm">Correo electrónico</label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-4 py-3 bg-mpf-warmGray border border-gray-200/50 rounded-xl text-mpf-dark placeholder-gray-400 focus:ring-2 focus:ring-mpf-teal/20 focus:border-mpf-teal transition-all"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-500 mb-2 text-sm">Contraseña</label>
              <input
                type="password"
                {...register('password')}
                className="w-full px-4 py-3 bg-mpf-warmGray border border-gray-200/50 rounded-xl text-mpf-dark placeholder-gray-400 focus:ring-2 focus:ring-mpf-teal/20 focus:border-mpf-teal transition-all"
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full px-4 py-3 bg-mpf-teal text-white rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50 font-medium"
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>

            <p className="text-center text-gray-400">
              ¿No tienes cuenta?{' '}
              <Link 
                href="/register" 
                className="text-mono-purple hover:text-mono-pink transition-colors"
              >
                Regístrate aquí
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
} 