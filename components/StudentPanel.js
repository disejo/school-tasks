

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

async function getClassroomName(classroomId) {
  if (!classroomId) return "";
  const snap = await getDocs(query(collection(db, "classrooms"), where("name", "!=", "")));
  const doc = snap.docs.find(d => d.id === classroomId);
  return doc ? doc.data().name : classroomId;
}

async function getSubjectName(subjectId) {
  if (!subjectId) return "";
  const snap = await getDocs(query(collection(db, "subjects"), where("name", "!=", "")));
  const doc = snap.docs.find(d => d.id === subjectId);
  return doc ? doc.data().name : subjectId;
}

async function getTeacherName(teacherDni) {
  if (!teacherDni) return "";
  const snap = await getDocs(query(collection(db, "users"), where("role", "==", "teacher"), where("dni", "==", teacherDni)));
  if (!snap.empty) {
    return snap.docs[0].data().name;
  }
  return teacherDni;
}

export default function StudentPanel({ name, studentId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [classroomNames, setClassroomNames] = useState({});
  const [subjectNames, setSubjectNames] = useState({});
  const [teacherNames, setTeacherNames] = useState({});

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);
      try {
  // Traer todas las tareas y filtrar en JS por studentId en el array students
  const q = query(collection(db, "task"));
        const snap = await getDocs(q);
        // Filtrar solo las tareas donde el studentId está en students
        const filtered = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(task => Array.isArray(task.students) && task.students.some(s => s.studentId === studentId));
        // Ordenar por fecha descendente
        filtered.sort((a, b) => {
          const dateA = new Date(a.date || a.createdAt);
          const dateB = new Date(b.date || b.createdAt);
          return dateB - dateA;
        });
        setTasks(filtered);

        // Obtener nombres únicos de aula, asignatura y docente
        const classroomIds = Array.from(new Set(filtered.map(t => t.classroomId).filter(Boolean)));
        const subjectIds = Array.from(new Set(filtered.map(t => t.subjectId).filter(Boolean)));
        const teacherIds = Array.from(new Set(filtered.map(t => t.teacherId).filter(Boolean)));

        const classroomNamesObj = {};
        for (const id of classroomIds) {
          classroomNamesObj[id] = await getClassroomName(id);
        }
        setClassroomNames(classroomNamesObj);

        const subjectNamesObj = {};
        for (const id of subjectIds) {
          subjectNamesObj[id] = await getSubjectName(id);
        }
        setSubjectNames(subjectNamesObj);

        const teacherNamesObj = {};
        for (const id of teacherIds) {
          teacherNamesObj[id] = await getTeacherName(id);
        }
        setTeacherNames(teacherNamesObj);

      } catch (error) {
        console.error("Error al cargar tareas del alumno:", error);
      }
      setLoading(false);
    }
    if (studentId) fetchTasks();
  }, [studentId]);

    // Colores para notas
  const typeColors = {
    ML: "p-1 text-center rounded bg-yellow-600",
    L: "p-1 text-center rounded bg-green-600",
    NL: "p-1 text-center rounded bg-red-600",
    1: "p-1 text-center rounded bg-red-600",
    2: "p-1 text-center rounded bg-red-500",
    3: "p-1 text-center rounded bg-red-600",
    4: "p-1 text-center rounded bg-red-600",
    5: "p-1 text-center rounded bg-yellow-600",
    6: "p-1 text-center rounded bg-yellow-600",
    7: "p-1 text-center rounded bg-green-600",
    8: "p-1 text-center rounded bg-green-600",
    9: "p-1 text-center rounded bg-green-600",
    10: "p-1 text-center rounded bg-green-600",
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="bg-white p-8 rounded shadow-md w-full text-center dark:bg-gray-900 dark:text-white">
  <div className="mt-8 w-full overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">Tareas y evaluaciones</h2>
          {loading ? (
            <div className="text-center text-gray-500 dark:text-gray-400">Cargando...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400">No hay tareas registradas.</div>
          ) : (
            <table className="w-full border dark:border-gray-700 rounded mb-2 text-sm">
              <thead>
                <tr className="bg-gray-200 dark:bg-gray-700">
                  <th className="py-2 px-4">Fecha</th>
                  <th className="py-2 px-4">Nombre</th>
                  <th className="py-2 px-4">Tipo</th>
                  <th className="py-2 px-4">Desarrollo</th>
                  <th className="py-2 px-4">Nota/Logro</th>
                  <th className="py-2 px-4">Asignatura</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => {
                  let nota = "-";
                  if (Array.isArray(task.students)) {
                    // Si es array de objetos tipo {studentId, value}
                    if (typeof task.students[0] === "object" && task.students[0] !== null) {
                      const studentObj = task.students.find(s => s.studentId === studentId);
                      nota = studentObj ? studentObj.value : "-";
                    } else if (Array.isArray(task.students[0])) {
                      // Si es array de arrays tipo [[id, nota], ...]
                      const arr = task.students.find(s => Array.isArray(s) && s[0] === studentId);
                      nota = arr ? arr[1] : "-";
                    } else {
                      // Si es array plano tipo [id, nota]
                      if (task.students[0] === studentId) {
                        nota = task.students[1] ?? "-";
                      }
                    }
                  }
                  return (
                    <tr key={task.id} className="border-t dark:border-gray-700 dark:bg-gray-800">
                      <td className="py-2 px-4">{task.date ? task.date : (task.createdAt ? new Date(task.createdAt.seconds ? task.createdAt.seconds * 1000 : task.createdAt).toLocaleDateString() : "")}</td>
                      <td className="py-2 px-4">{task.name}</td>
                      <td className="py-2 px-4">{task.type === "evaluacion" ? "Evaluación" : "Tarea"}</td>
                      <td className="py-2 px-4">{task.observation}</td>
                      <td className="py-2 px-4"><span className={`${typeColors[nota] || "bg-indigo-200"}`}>{nota}</span></td>
                      <td className="py-2 px-4">{subjectNames[task.subjectId] || task.subjectId}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
