"use client"

import React, { useState } from 'react';
import PrimaryButton from '../../components/primarybutton';
import { useRouter } from 'next/navigation';
import { loginWithDni } from '../api/auth';

export default function LoginPage() {
  const [dni, setDni] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await loginWithDni(dni);
    if (result.success) {
      router.push('/dashboard');
    } else {
      // Si el error es un string legible, lo mostramos. Si es HTML, objeto o token, mostramos mensaje genérico.
      if (typeof result.error === 'string' && result.error.length < 100 && !result.error.includes('<')) {
        setError(result.error);
      } else {
        setError('No tienes acceso o ocurrió un error inesperado.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <form onSubmit={handleSubmit} style={{ background: 'var(--success-bg)', color: 'var(--success-text)' }} className="p-8 rounded shadow-md w-80">
        <h2 className="text-2xl font-bold mb-6 text-center">Iniciar sesión con tu DNI</h2>
        <input
          type="text"
          value={dni}
          onChange={(e) => setDni(e.target.value)}
          className="w-full px-3 py-2 rounded hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
          style={{ color: 'var(--foreground)', background: 'var(--background)' }}
        />
        <br />
        {Boolean(error) && (
          <p style={{ color: 'var(--error-text)', background: 'var(--error-bg)' }} className="mb-4 p-2 rounded">
            {typeof error === 'string' && error.trim() !== '' ? error : 'Ocurrió un error inesperado.'}
          </p>
        )}
        <br />
        <PrimaryButton loading={loading} loadingText="Ingresando...">
          Ingresar
        </PrimaryButton>
      </form>
    </div>
  );
}
