
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
};

const app = initializeApp(firebaseConfig); 

const db = getFirestore(app);
export { db };

import { getDocs, query, where } from "firebase/firestore";

// Obtener todas las aulas
export async function getClassrooms() {
  const snapshot = await getDocs(collection(db, "classrooms"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}


// Obtener asignaturas por aula
export async function getSubjectsByClassroom(classroomId) {
  // Buscar los subjectId en classroom_subjects
  const classroomSubjectsSnap = await getDocs(query(collection(db, "classroom_subjects"), where("classroomId", "==", classroomId)));
  const subjectIds = classroomSubjectsSnap.docs.map(doc => doc.data().subjectId);
  if (subjectIds.length === 0) return [];
  // Obtener todas las asignaturas y filtrar en memoria
  const subjectsSnap = await getDocs(collection(db, "subjects"));
  return subjectsSnap.docs
    .filter(doc => subjectIds.includes(doc.id))
    .map(doc => ({ id: doc.id, ...doc.data() }));
}


// Obtener estudiantes por aula
export async function getStudentsByClassroom(classroomId) {
  const enrollmentsSnap = await getDocs(query(collection(db, "classroom_enrollments"), where("classroomId", "==", classroomId)));
  return enrollmentsSnap.docs.map(doc => ({ studentId: doc.data().studentId, studentName: doc.data().studentName }));
}

// Crear tarea en la colección 'task'
export async function createTask(taskData) {
  const docRef = await addDoc(collection(db, "task"), {
    ...taskData,
    createdAt: new Date(),
  });
  return docRef.id;
}
