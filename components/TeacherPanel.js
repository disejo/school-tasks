

import { useState, useEffect } from "react";
import { db, getClassrooms, getSubjectsByClassroom } from "../lib/firebase";
import { collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";
import TeacherNewTask from "./TeacherNewTask";
import TeacherViewTask from "./TeacherViewTask";
import PrimaryButton from "@/components/primarybutton";


export default function TeacherPanel({ teacherId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showViewTask, setShowViewTask] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Cargar aulas y asignaturas
  useEffect(() => {
    getClassrooms().then(setClassrooms);
  }, []);

  useEffect(() => {
    async function fetchSubjects() {
      // Obtener todos los subjectIds únicos de las tareas
      const subjectIds = Array.from(new Set(tasks.map(t => t.subjectId)));
      let allSubjects = [];
      for (const classroomId of Array.from(new Set(tasks.map(t => t.classroomId)))) {
        const subs = await getSubjectsByClassroom(classroomId);
        allSubjects = [...allSubjects, ...subs];
      }
      // Filtrar solo los que aparecen en subjectIds
      setSubjects(allSubjects.filter(s => subjectIds.includes(s.id)));
    }
    if (tasks.length > 0) fetchSubjects();
  }, [tasks]);

  // Cargar todas las tareas del docente
  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);
      try {
        const q = query(collection(db, "task"), where("teacherId", "==", teacherId));
        const snap = await getDocs(q);
        setTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error al cargar tareas:", error);
      }
      setLoading(false);
    }
    if (teacherId) fetchTasks();
  }, [teacherId]);

  // Eliminar tarea
  const handleDelete = async (taskId) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, "task", taskId));
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error("Error al eliminar tarea:", error);
      alert("Error al eliminar la tarea.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 dark:bg-gray-900 mx-2">
      <h2 className="text-2xl mb-6 text-center dark:text-white">Panel del docente</h2>
      <div className="flex flex-col md:flex-row gap-4 w-full">
        {/* Card de tareas creadas */}
        <div className="w-full md:w-1/2">
          <div className="bg-white dark:bg-gray-800 rounded shadow-lg p-4 mb-4 w-full">
            <div className="flex justify-end mb-4">
              <PrimaryButton onClick={() => setShowNewTask(true)}>
                Crear nueva tarea
              </PrimaryButton>
            </div>
            <h3 className="text-lg mb-2 dark:text-white">Tareas creadas</h3>
            {loading ? (
              <div className="text-center text-gray-500 dark:text-gray-400">Cargando...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400">No hay tareas registradas.</div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="min-w-[700px] w-full border dark:border-gray-700 rounded mb-2 text-base">
                  <thead>
                    <tr className="bg-gray-200 dark:bg-gray-700">
                      <th className="py-2 px-4 text-left">Fecha</th>
                      <th className="py-2 px-4 text-left">Nombre</th>
                      <th className="py-2 px-4 text-left">Aula</th>
                      <th className="py-2 px-4 text-left">Asignatura</th>
                      <th className="py-2 px-4 text-left">Tipo</th>
                      <th className="py-2 px-4 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks
                      .slice()
                      .sort((a, b) => {
                        // Ordenar por fecha descendente
                        const dateA = new Date(a.date || a.createdAt);
                        const dateB = new Date(b.date || b.createdAt);
                        return dateB - dateA;
                      })
                      .map(task => {
                        const classroom = classrooms.find(c => c.id === task.classroomId);
                        const subject = subjects.find(s => s.id === task.subjectId);
                        return (
                          <tr key={task.id} className="border-t dark:border-gray-700 dark:bg-gray-800">
                            <td className="py-2 px-4">{task.date ? task.date : (task.createdAt ? new Date(task.createdAt.seconds ? task.createdAt.seconds * 1000 : task.createdAt).toLocaleDateString() : "")}</td>
                            <td className="py-2 px-4">{task.name}</td>
                            <td className="py-2 px-4">{classroom ? classroom.name : task.classroomId}</td>
                            <td className="py-2 px-4">{subject ? subject.name : task.subjectId}</td>
                            <td className="py-2 px-4">{task.type}</td>
                            <td className="py-2 px-4 flex gap-2">
                              <PrimaryButton onClick={() => { setSelectedTaskId(task.id); setShowViewTask(true); }}>
                                Editar / Ver
                              </PrimaryButton>
                              <PrimaryButton onClick={() => handleDelete(task.id)} className="bg-red-600 hover:bg-red-700">
                                Eliminar
                              </PrimaryButton>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        {/* Card de edición o creación */}
        <div className="w-full md:w-1/2">
          <div className="w-full">
            {showNewTask && (
              <TeacherNewTask teacherId={teacherId} onClose={() => setShowNewTask(false)} />
            )}
            {showViewTask && (
              <TeacherViewTask teacherId={teacherId} taskId={selectedTaskId} onClose={() => setShowViewTask(false)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}