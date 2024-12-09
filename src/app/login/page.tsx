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
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('wallet_mono_ix_users')
        .select('email, password_hash')
        .eq('email', data.email)
        .single();

      if (userError || !userData) {
        throw new Error('Credenciales inválidas');
      }

      const passwordMatch = await bcrypt.compare(data.password, userData.password_hash);

      if (!passwordMatch) {
        throw new Error('Credenciales inválidas');
      }

      setMessage({ type: 'success', text: 'Inicio de sesión exitoso' });
      localStorage.setItem('userEmail', userData.email);
      router.push('/dashboard');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  return (
    <div className="min-h-screen bg-mono-dark">
      <div className="max-w-md mx-auto px-8 py-12">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold text-white">Iniciar Sesión</h1>
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

          <button
            type="submit"
            className="w-full py-3 bg-mono-purple text-white rounded-xl hover:bg-opacity-90 transition-all"
          >
            Iniciar Sesión
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
  );
} 