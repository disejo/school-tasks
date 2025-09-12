import { useState, useEffect, useCallback, useMemo } from "react";
import { getClassrooms, getSubjectsByClassroom, getStudentsByClassroom, createTask } from "../lib/firebase";
import PrimaryButton from "@/components/primarybutton";
import SecondaryButton from "@/components/secondarybutton";

export default function TeacherNewTask({ teacherId, onClose }) {
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState("");
  const [taskName, setTaskName] = useState("");
  const [observation, setObservation] = useState("");
  const [achieved, setAchieved] = useState({});
  const [taskType, setTaskType] = useState("tarea");
  const [isEvaluation, setIsEvaluation] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    getClassrooms().then(data => { if (mounted) setClassrooms(data); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (selectedClassroom) {
      getSubjectsByClassroom(selectedClassroom).then(setSubjects);
      setSelectedSubject("");
    } else {
      setSubjects([]);
      setSelectedSubject("");
    }
  }, [selectedClassroom]);

  useEffect(() => {
    if (selectedClassroom && selectedSubject) {
      getStudentsByClassroom(selectedClassroom).then(data => {
        setStudents(data);
        if (taskType === "tarea") {
          const defaultAchieved = {};
          data.forEach(s => { defaultAchieved[s.studentId] = "L"; });
          setAchieved(defaultAchieved);
        } else {
          setAchieved({});
        }
      });
    } else {
      setStudents([]);
      setAchieved({});
    }
  }, [selectedClassroom, selectedSubject, taskType]);

  useEffect(() => {
    setIsEvaluation(taskType === "evaluacion");
    setAchieved({});
  }, [taskType]);

  const handleAchievedChange = useCallback((studentId, value) => {
    setAchieved(prev => ({ ...prev, [studentId]: value }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!selectedClassroom || !selectedSubject || !taskType || !date || !taskName || !observation || students.length === 0 || !teacherId) {
        alert("Todos los campos son obligatorios y debe haber estudiantes cargados. El DNI del docente es requerido.");
        return;
      }
      if (students.some(s => achieved[s.studentId] === undefined || achieved[s.studentId] === "")) {
        alert("Debes seleccionar un valor para todos los estudiantes.");
        return;
      }
      await createTask({
        classroomId: selectedClassroom,
        subjectId: selectedSubject,
        date,
        name: taskName,
        observation,
        teacherId,
        type: taskType,
        students: students.map((s) => ({
          studentId: s.studentId,
          value: achieved[s.studentId] ?? (isEvaluation ? "1" : "L"),
        })),
      });
      setSelectedClassroom("");
      setSelectedSubject("");
      setDate("");
      setTaskName("");
      setObservation("");
      setAchieved({});
      setTaskType("");
    } finally {
      setLoading(false);
    }
  }, [selectedClassroom, selectedSubject, date, taskName, observation, teacherId, students, achieved, taskType, isEvaluation]);

  const classroomOptions = useMemo(() => [
    <option value="" key="empty">Selecciona un aula</option>,
    ...classrooms.map(c => (
      <option key={c.id} value={c.id}>{c.name}</option>
    ))
  ], [classrooms]);

  const subjectOptions = useMemo(() => [
    <option value="" key="empty">Selecciona una asignatura</option>,
    ...subjects.map(s => (
      <option key={s.id} value={s.id}>{s.name}</option>
    ))
  ], [subjects]);

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full">
        <h2 className="text-2xl mb-6 text-center dark:text-white">Crear nueva tarea</h2>
        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex flex-col gap-4 w-full">
            <div>
              <label>Aula:</label>
              <select value={selectedClassroom} onChange={e => setSelectedClassroom(e.target.value)} className="mt-1 dark:bg-gray-700 dark:text-white rounded px-2 py-3 w-full">
                {classroomOptions}
              </select>
            </div>
            <div>
              <label>Asignatura:</label>
              <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="mt-1 dark:bg-gray-700 dark:text-white rounded px-2 py-3 w-full">
                {subjectOptions}
              </select>
            </div>
            <div>
              <label>Fecha:</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 dark:bg-gray-700 dark:text-white rounded px-2 py-1 w-full" />
            </div>
            <div>
              <label>Nombre de la tarea:</label>
              <input type="text" value={taskName} onChange={e => setTaskName(e.target.value)} className="mt-1 dark:bg-gray-700 dark:text-white rounded px-2 py-1 w-full" />
            </div>
            <div className="flex items-center gap-4">
              <label>Tipo:</label>
              <label className="flex items-center gap-2">
                <input type="radio" name="tipo" value="tarea" checked={taskType === "tarea"} onChange={e => setTaskType(e.target.value)} /> Tarea
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="tipo" value="evaluacion" checked={taskType === "evaluacion"} onChange={e => setTaskType(e.target.value)} /> Evaluación
              </label>
            </div>
            <div>
              <label>Observación:</label>
              <textarea value={observation} onChange={e => setObservation(e.target.value)} className="mt-1 w-full dark:bg-gray-700 dark:text-white rounded px-2 py-1" rows={3} />
            </div>
          </div>
          <div className="overflow-x-auto mt-6">
            <h3 className="text-lg mb-2 dark:text-white">Estudiantes</h3>
            <table className="w-full border dark:border-gray-700 rounded overflow-hidden">
              <thead>
                <tr className="bg-gray-200 dark:bg-gray-700">
                  <th className="py-2 px-4 text-left">Nombre</th>
                  <th className="py-2 px-4 text-left">{isEvaluation ? "Nota" : "Logró objetivo"}</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.studentId} className="border-t dark:border-gray-700 dark:bg-gray-800">
                    <td className="py-2 px-4">{student.studentName}</td>
                    <td className="py-2 px-4">
                      {isEvaluation ? (
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
          </div>
          <div className="flex justify-center gap-4 mt-8">
            <PrimaryButton loading={loading} loadingText="Creando tarea...">
              Crear tarea
            </PrimaryButton>
            {onClose && (
            <SecondaryButton onClick={onClose} loading={loading} loadingText="Cerrando..." >Cerrar</SecondaryButton>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
