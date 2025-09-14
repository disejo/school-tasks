import { useState, useEffect, useCallback } from "react";
import { getStudentsByClassroom, db } from "../lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import PrimaryButton from "@/components/primarybutton";
import SecondaryButton from "@/components/secondarybutton";

export default function TeacherEditTask({ teacherId, taskId, onClose }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [students, setStudents] = useState([]);
  const [achieved, setAchieved] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchTask() {
      if (!taskId) return;
      setLoading(true);
      const snap = await getDocs(query(collection(db, "task"), where("teacherId", "==", teacherId)));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const task = data.find(t => t.id === taskId);
      setSelectedTask(task || null);
      setLoading(false);
    }
    if (taskId) fetchTask();
  }, [taskId, teacherId]);

  useEffect(() => {
    if (selectedTask) {
      getStudentsByClassroom(selectedTask.classroomId).then(data => {
        setStudents(data);
        const achievedMap = {};
        if (selectedTask.students) {
          selectedTask.students.forEach(s => {
            achievedMap[s.studentId] = s.value;
          });
        }
        setAchieved(achievedMap);
      });
    } else {
      setStudents([]);
      setAchieved({});
    }
  }, [selectedTask]);

  const handleAchievedChange = useCallback((studentId, value) => {
    setAchieved(prev => ({ ...prev, [studentId]: value }));
  }, []);

  const handleUpdate = async () => {
    if (!selectedTask) return;
    setLoading(true);
    await updateDoc(doc(db, "task", selectedTask.id), {
      students: students.map(s => ({
        studentId: s.studentId,
        value: achieved[s.studentId] ?? "",
      }))
    });
    setLoading(false);
    alert("Tarea actualizada");
  };

  if (!selectedTask) {
    return (
      <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 mx-4 rounded shadow-lg w-full max-w-2xl">
          <div className="text-gray-500 dark:text-gray-400">No se encontró la tarea.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 mx-2 rounded shadow-lg w-full">
        <h2 className="text-2xl font-bold mb-6 text-center dark:text-white">Editar tarea</h2>
        <div className="space-y-2 mb-6">
          <div><span className="font-semibold">Nombre:</span> {selectedTask.name}</div>
          <div><span className="font-semibold">Fecha:</span> {selectedTask.date}</div>
          <div><span className="font-semibold">Observación:</span> {selectedTask.observation}</div>
          <div><span className="font-semibold">Tipo:</span> {selectedTask.type === "evaluacion" ? "Evaluación" : "Tarea"}</div>
        </div>
        <h3 className="text-lg font-semibold mb-2 dark:text-white">Estudiantes</h3>
        <table className="w-full border dark:border-gray-700 rounded overflow-hidden mb-4">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700">
              <th className="py-2 px-4 text-left">Nombre</th>
              <th className="py-2 px-4 text-left">{selectedTask.type === "evaluacion" ? "Nota" : "Logró objetivo"}</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.studentId} className="border-t dark:border-gray-700 dark:bg-gray-800">
                <td className="py-2 px-4">{student.studentName}</td>
                <td className="py-2 px-4">
                  {selectedTask.type === "evaluacion" ? (
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={achieved[student.studentId] ?? ""}
                      onChange={e => handleAchievedChange(student.studentId, e.target.value)}
                      className="w-20 text-center dark:bg-gray-700 dark:text-white rounded px-2 py-3"
                      required
                    />
                  ) : (
                    <select
                      value={achieved[student.studentId] ?? "L"}
                      onChange={e => handleAchievedChange(student.studentId, e.target.value)}
                      className="w-28 text-center dark:bg-gray-700 dark:text-white rounded px-2 py-3"
                      required
                    >
                      <option value="L">L</option>
                      <option value="ML">ML</option>
                      <option value="NL">NL</option>
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex gap-4 justify-center mt-4">
          <PrimaryButton loading={loading} onClick={handleUpdate} loadingText="Guardando...">Guardar cambios</PrimaryButton>
          {onClose && (
            <SecondaryButton onClick={onClose} loading={loading} loadingText="Cerrando..." >Cerrar</SecondaryButton>
          )}
        </div>
      </div>
    </div>
  );
}
