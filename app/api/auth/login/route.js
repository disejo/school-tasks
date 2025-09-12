import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const JWT_SECRET = process.env.JWT_SECRET || 'clave_desarrollo_segura';

export async function POST(request) {
  const { dni } = await request.json();
  if (!dni) {
    return NextResponse.json({ error: 'DNI requerido' }, { status: 400 });
  }
  // Buscar usuario en Firestore usando el SDK modular
  const q = query(collection(db, 'users'), where('dni', '==', dni));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 });
  }
  const user = snapshot.docs[0].data();
  const token = jwt.sign({ dni: user.dni, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '1h' });
  const response = NextResponse.json({ success: true, role: user.role, name: user.name });
  response.cookies.set('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60,
  });
  return response;
}
