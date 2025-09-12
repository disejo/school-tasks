"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { verifyDni } from '../auth/loginService';

export default function LoginPage() {
  const [dni, setDni] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const exists = await verifyDni(dni);
      if (exists) {
        router.push(`/dashboard?dni=${dni}`);
      } else {
        setError('DNI no encontrado. No tienes acceso.');
      }
    } catch (err) {
      setError('Error al verificar el DNI.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <form onSubmit={handleSubmit} style={{ background: 'var(--success-bg)', color: 'var(--success-text)' }} className="p-8 rounded shadow-md w-80">
        <h2 className="text-2xl font-bold mb-6 text-center">Iniciar sesión</h2>
        <label className="block mb-4">
          <span className="block mb-2">DNI</span>
          <input
            type="text"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
            style={{ color: 'var(--foreground)', background: 'var(--background)' }}
          />
        </label>
        {error && <p style={{ color: 'var(--error-text)', background: 'var(--error-bg)' }} className="mb-4 p-2 rounded">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
