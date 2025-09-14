import { useState, useEffect } from "react";
import { db, getClassrooms, getSubjectsByClassroom } from "../lib/firebase";
import { collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";
import TeacherNewTask from "./TeacherNewTask";
import TeacherEditTask from "./TeacherEditTask";
import PrimaryButton from "@/components/primarybutton";
import Icon from '@mdi/react';
import { mdiPencil } from '@mdi/js';
import { mdiTrashCan } from '@mdi/js';

export default function TeacherPanel({ teacherId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showViewTask, setShowViewTask] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Cargar aulas y asignaturas
  useEffect(() => {
    getClassrooms().then(setClassrooms);
  }, []);

  useEffect(() => {
    async function fetchSubjects() {
      const subjectIds = Array.from(new Set(tasks.map(t => t.subjectId)));
      let allSubjects = [];
      for (const classroomId of Array.from(new Set(tasks.map(t => t.classroomId)))) {
        const subs = await getSubjectsByClassroom(classroomId);
        allSubjects = [...allSubjects, ...subs];
      }
      setSubjects(allSubjects.filter(s => subjectIds.includes(s.id)));
    }
    if (tasks.length > 0) fetchSubjects();
  }, [tasks]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "task"), where("teacherId", "==", teacherId));
      const snap = await getDocs(q);
      setTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error al cargar tareas:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (teacherId) fetchTasks();
  }, [teacherId]);

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

  // Colores para tipos de tarea
  const typeColors = {
    tarea: "p-1 text-center rounded bg-indigo-600",
    evaluacion: "p-1 text-center rounded bg-green-600",
  };
  // Manejo de visibilidad al hacer scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > lastScrollY) {
        // si se desplaza hacia abajo → ocultar
        setIsVisible(false);
      } else {
        // si se desplaza hacia arriba → mostrar
        setIsVisible(true);
      }
      setLastScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div className="flex flex-col min-h-screen mx-2 relative">
      <div className="w-[calc(100%+2rem)] -mx-4">
        <div className="rounded shadow-lg p-4 mb-4 w-full">
          <h3 className="text-lg mb-2 dark:text-white">Tareas creadas</h3>
          {loading ? (
            <div className="text-center text-gray-500 dark:text-gray-400">Cargando...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400">No hay tareas registradas.</div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="min-w-[700px] w-full border dark:border-gray-700 rounded mb-2 text-sm">
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
                          <td className="py-2 px-4">
                          <span className={`${typeColors[task.type] || "bg-gray-200"}`}>{task.type}</span>
                          </td>
                          <td className="py-2 px-4 flex gap-2">
                            <PrimaryButton onClick={() => { setSelectedTaskId(task.id); setShowViewTask(true); }}>
                              <Icon path={mdiPencil} size={0.5} />
                            </PrimaryButton>
                            <PrimaryButton onClick={() => handleDelete(task.id)} className="bg-red-600 hover:bg-red-700 p-2 rounded">
                              <Icon path={mdiTrashCan} size={0.5} />
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
      {/* Botón flotante para crear tarea */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={() => setShowNewTask(true)}
          className={`bg-blue-700 hover:bg-blue-800 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg text-3xl focus:outline-none fixed bottom-6 right-6 transition-opacity duration-300 ${
            isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          aria-label="Crear nueva tarea"
        >
          +
        </button>
      </div>
      {/* Card de edición o creación */}
      <div className="w-full">
        <div className="flex flex-col">
          {showNewTask && (
            <TeacherNewTask
              teacherId={teacherId}
              onClose={() => setShowNewTask(false)}
              onCreated={() => {
                setShowNewTask(false);
                fetchTasks();
              }}
            />
          )}
          {showViewTask && (
            <TeacherEditTask teacherId={teacherId} taskId={selectedTaskId} onClose={() => setShowViewTask(false)} />
          )}
        </div>
      </div>
    </div>
  );
}