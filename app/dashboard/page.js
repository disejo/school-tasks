"use client"
import React, { useEffect, useState } from 'react';
import Loading from '../../components/loading';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { verifyToken } from '../api/auth';
import AdminPanel from '../../components/AdminPanel';
import StudentPanel from '../../components/StudentPanel';
import TeacherPanel from '../../components/TeacherPanel';

export default function DashboardPage() {

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      const user = await verifyToken();
      if (!user || user.error) {
        router.push('/login');
        setLoading(false);
        return;
      }
      setName(user.name);
      setRole(user.role);
      setLoading(false);
    }
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return <Loading />;
  }

  // Si no hay usuario autenticado, no renderizar nada (ya se redirige en useEffect)
  if (!name || !role) {
    return <Loading />;
  }

  // Navbar sticky con imagen, nombre y menú de logout
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <nav className="sticky top-0 z-10 bg-white dark:bg-gray-900 shadow flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <Image src="/globe.svg" alt="Avatar" width={40} height={40} className="rounded-full" />
        </div>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-lg text-gray-800 dark:text-white">{name}</span>
          <div className="relative group">
            <button className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700">
              🔽
            </button>
            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
              <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600">Salir del sistema</button>
            </div>
          </div>
        </div>
      </nav>
      <main className="pt-6">
        {role === 'ADMIN' && <AdminPanel name={name} />}
        {role === 'DOCENTE' && <TeacherPanel name={name} />}
        {role === 'ESTUDIANTE' && <StudentPanel name={name} />}
      </main>
    </div>
  );
}
