import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function verifyDni(dni) {
  const q = query(
    collection(db, 'users'),
    where('dni', '==', dni),
    where('role', '==', 'ADMIN')
  );
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}
