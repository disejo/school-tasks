"use client"
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
export default function DashboardPage() {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const dni = searchParams.get('dni');

  useEffect(() => {
    async function fetchUser() {
      if (!dni) {
        router.push('/login');
        return;
      }
      const q = query(collection(db, 'users'), where('dni', '==', dni));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        setName(userData.name);
        setRole(userData.role);
      } else {
        router.push('/login');
      }
    }
    fetchUser();
  }, [dni, router]);

  const handleLogout = () => {
    router.push('/login');
  };

  if (role === 'ESTUDIANTE') {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        <div style={{ background: 'var(--success-bg)', color: 'var(--success-text)' }} className="p-8 rounded shadow-md w-80 text-center">
          <h2 className="text-2xl font-bold mb-6">Hola {name ? name : '...'}</h2>
          <p>Bienvenido al dashboard de estudiante.</p>
          <button onClick={handleLogout} className="mt-6 px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">Salir</button>
        </div>
      </div>
    );
  }
  if (role === 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        <div style={{ background: 'var(--success-bg)', color: 'var(--success-text)' }} className="p-8 rounded shadow-md w-80 text-center">
          <h2 className="text-2xl font-bold mb-6">Hola {name ? name : '...'}</h2>
          <p>Acceso concedido.</p>
          <button onClick={handleLogout} className="mt-6 px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">Salir</button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-80 text-center">
        <h2 className="text-2xl font-bold mb-6">Buscando usuario...</h2>
      </div>
    </div>
  );
}
