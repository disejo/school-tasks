"use client";

import { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, onAuthStateChanged, signOut, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, setLogLevel } from 'firebase/firestore';

// El siguiente código utiliza variables de entorno.
// Debes crear un archivo .env.local en la raíz de tu proyecto
// con la configuración de Firebase para que esto funcione.

const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const initialAuthToken = null; // En este ejemplo, el token inicial no se usa

// DNI del administrador
const ADMIN_DNI = '43102640';

// Componente principal de la aplicación
export default function App() {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [currentDni, setCurrentDni] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [viewingStudentDni, setViewingStudentDni] = useState(null);
    const [studentData, setStudentData] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [newActivity, setNewActivity] = useState({ tema: '', estado: 'Pendiente' });
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');
    const [unsubscribe, setUnsubscribe] = useState(null);

    // Inicializar Firebase y manejar la autenticación
    useEffect(() => {
        setLogLevel('debug');
        if (Object.keys(firebaseConfig).some(key => !firebaseConfig[key])) {
            console.error("Firebase config incompleta. Revisa tus variables de entorno.");
            return;
        }

        const app = initializeApp(firebaseConfig);
        const authInstance = getAuth(app);
        const dbInstance = getFirestore(app);

        setAuth(authInstance);
        setDb(dbInstance);

        const authListener = onAuthStateChanged(authInstance, async (user) => {
            if (user) {
                setUserId(user.uid);
            }
            setIsAuthReady(true);
        });

        // Intentar iniciar sesión con el token personalizado
        if (initialAuthToken) {
            signInWithCustomToken(authInstance, initialAuthToken).catch(console.error);
        } else {
            signInAnonymously(authInstance).catch(console.error);
        }

        return () => authListener();
    }, []);

    // Escuchar los datos del estudiante en tiempo real
    useEffect(() => {
        if (!isAuthReady || !viewingStudentDni || !db || !userId) return;

        if (unsubscribe) {
            unsubscribe();
        }

        const userDocPath = `artifacts/${appId}/public/data/usuarios/${viewingStudentDni}`;
        const userDocRef = doc(db, userDocPath);

        const newUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setStudentData(docSnap.data());
            } else {
                setStudentData({ nombre: 'Estudiante Nuevo', aula: '', asignatura: '', actividades: [] });
            }
        }, (error) => {
            console.error("Error al escuchar cambios en Firestore:", error);
            showMessage("Error de conexión. No se pueden cargar los datos en tiempo real.", 'error');
        });

        setUnsubscribe(() => newUnsubscribe);

        return () => {
            if (newUnsubscribe) newUnsubscribe();
        };
    }, [isAuthReady, viewingStudentDni, db, userId]);

    // Función para mostrar mensajes de estado
    const showMessage = (text, type) => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => {
            setMessage('');
        }, 3000);
    };

    // Manejar el inicio de sesión
    const handleLogin = (e) => {
        e.preventDefault();
        if (currentDni.trim() === ADMIN_DNI) {
            setIsAdmin(true);
            showMessage("Bienvenido, Administrador.", 'success');
        } else {
            setViewingStudentDni(currentDni.trim());
            showMessage("Bienvenido.", 'success');
        }
    };

    // Manejar el cierre de sesión
    const handleLogout = async () => {
        if (unsubscribe) {
            unsubscribe();
        }
        await signOut(auth);
        setCurrentDni('');
        setIsAdmin(false);
        setViewingStudentDni(null);
        setStudentData(null);
        showMessage("Sesión cerrada.", 'success');
    };

    // Manejar la adición de una actividad
    const handleAddActivity = async (e) => {
        e.preventDefault();
        if (!newActivity.tema) {
            showMessage("El tema de la actividad es obligatorio.", 'error');
            return;
        }

        if (!studentData) {
            showMessage("Los datos del estudiante aún no se han cargado.", "error");
            return;
        }

        const newActivities = studentData.actividades ? [...studentData.actividades, { ...newActivity, id: crypto.randomUUID() }] : [{ ...newActivity, id: crypto.randomUUID() }];
        
        try {
            const userDocRef = doc(db, `artifacts/${appId}/public/data/usuarios/${viewingStudentDni}`);
            await setDoc(userDocRef, { ...studentData, actividades: newActivities }, { merge: true });
            showMessage("Actividad agregada exitosamente.", 'success');
            setNewActivity({ tema: '', estado: 'Pendiente' });
            setShowModal(false);
        } catch (error) {
            console.error("Error al agregar la actividad:", error);
            showMessage("Error al guardar la actividad. Intenta de nuevo.", 'error');
        }
    };
    
    // Cambiar el estado de una actividad
    const handleStatusChange = async (id, newStatus) => {
        const updatedActivities = studentData.actividades.map(act => 
            act.id === id ? { ...act, estado: newStatus } : act
        );
        try {
            const userDocRef = doc(db, `artifacts/${appId}/public/data/usuarios/${viewingStudentDni}`);
            await setDoc(userDocRef, { ...studentData, actividades: updatedActivities }, { merge: true });
            showMessage("Estado de la actividad actualizado.", 'success');
        } catch (error) {
            console.error("Error al actualizar el estado:", error);
            showMessage("Error al actualizar el estado. Intenta de nuevo.", 'error');
        }
    };

    // Eliminar una actividad
    const handleDeleteActivity = async (id) => {
        const updatedActivities = studentData.actividades.filter(act => act.id !== id);
        try {
            const userDocRef = doc(db, `artifacts/${appId}/public/data/usuarios/${viewingStudentDni}`);
            await setDoc(userDocRef, { ...studentData, actividades: updatedActivities }, { merge: true });
            showMessage("Actividad eliminada exitosamente.", 'success');
        } catch (error) {
            console.error("Error al eliminar la actividad:", error);
            showMessage("Error al eliminar la actividad. Intenta de nuevo.", 'error');
        }
    };

    // Manejar la búsqueda de estudiantes
    const handleSearchStudent = (e) => {
        e.preventDefault();
        setViewingStudentDni(e.target.studentDni.value.trim());
    };

    // Renderizar las vistas de la aplicación
    const renderView = () => {
        if (!isAuthReady) {
            return <div className="text-center p-8">Cargando...</div>;
        }

        if (!viewingStudentDni && !isAdmin) {
            return (
                <div id="login-section" className="flex flex-col items-center justify-center transition-all duration-500">
                    <h1 className="text-4xl font-bold text-white mb-6">Acceso a la Plataforma</h1>
                    <p className="text-gray-400 mb-8 text-center">Ingresa tu DNI para acceder a tus datos o al panel de administración.</p>
                    <form onSubmit={handleLogin} className="w-full max-w-sm">
                        <input
                            type="text"
                            placeholder="Número de DNI"
                            value={currentDni}
                            onChange={(e) => setCurrentDni(e.target.value)}
                            required
                            className="w-full px-4 py-3 mb-4 rounded-lg border-2 bg-gray-800 border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        />
                        <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors">
                            Ingresar
                        </button>
                    </form>
                </div>
            );
        }

        if (isAdmin && !viewingStudentDni) {
            return (
                <div id="admin-dashboard-section" className="flex flex-col transition-all duration-500">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-4xl font-bold text-white">Panel de Administración</h1>
                        <button onClick={handleLogout} className="bg-red-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
                            Salir
                        </button>
                    </div>
                    <p className="text-gray-400 mb-8 text-center">Ingresa el DNI del estudiante para gestionar sus datos.</p>
                    <form onSubmit={handleSearchStudent} className="w-full max-w-lg mx-auto flex space-x-2">
                        <input
                            name="studentDni"
                            type="text"
                            placeholder="DNI del estudiante"
                            required
                            className="flex-grow px-4 py-3 rounded-lg border-2 bg-gray-800 border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        />
                        <button type="submit" className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                            Ver Datos
                        </button>
                    </form>
                </div>
            );
        }

        return (
            <div id="student-dashboard-section" className="flex flex-col transition-all duration-500">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-4xl font-bold text-white">Datos de {studentData?.nombre || 'Estudiante Nuevo'}</h1>
                        <p className="text-gray-300 text-sm md:text-base mt-2">DNI: {viewingStudentDni}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        {isAdmin && (
                            <button onClick={() => setViewingStudentDni(null)} className="bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                                Volver
                            </button>
                        )}
                        <button onClick={handleLogout} className="bg-red-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
                            Salir
                        </button>
                    </div>
                </div>

                {isAdmin && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="mb-4 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors self-start disabled:bg-gray-500"
                        disabled={!studentData}
                    >
                        Agregar Nueva Actividad
                    </button>
                )}

                <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-lg">
                    <h2 className="text-2xl font-semibold mb-4 text-white">Información del Estudiante</h2>
                    <p className="text-gray-300"><strong>Nombre:</strong> {studentData?.nombre || 'N/A'}</p>
                    <p className="text-gray-300"><strong>Aula:</strong> {studentData?.aula || 'N/A'}</p>
                    <p className="text-gray-300"><strong>Asignatura:</strong> {studentData?.asignatura || 'N/A'}</p>
                </div>

                <div className="overflow-x-auto rounded-lg shadow-lg">
                    <table className="min-w-full bg-gray-900 rounded-lg">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Actividad</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Estado</th>
                                {isAdmin && <th className="px-4 py-3 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {studentData?.actividades?.length > 0 ? (
                                studentData.actividades.map((act) => (
                                    <tr key={act.id} className="hover:bg-gray-700 transition-colors">
                                        <td className="px-4 py-3 text-gray-300">{act.tema}</td>
                                        <td className="px-4 py-3">
                                            {isAdmin ? (
                                                <select
                                                    value={act.estado}
                                                    onChange={(e) => handleStatusChange(act.id, e.target.value)}
                                                    className="rounded-md border p-1 bg-gray-800 border-gray-600 text-white"
                                                >
                                                    <option>Pendiente</option>
                                                    <option>En progreso</option>
                                                    <option>Completado</option>
                                                </select>
                                            ) : (
                                                <span className="text-gray-300">{act.estado}</span>
                                            )}
                                        </td>
                                        {isAdmin && (
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <button onClick={() => handleDeleteActivity(act.id)} className="bg-red-600 text-white font-bold py-1 px-3 rounded-md hover:bg-red-700 transition-colors">
                                                    Eliminar
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={isAdmin ? "3" : "2"} className="text-center py-4 text-gray-400">No hay actividades asignadas.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Modal para agregar actividad */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                        <div className="bg-gray-900 rounded-xl shadow-2xl p-8 max-w-lg w-full border border-gray-700">
                            <h2 className="text-2xl font-bold text-white mb-4">Agregar Actividad</h2>
                            <form onSubmit={handleAddActivity}>
                                <div className="mb-4">
                                    <label htmlFor="tema" className="block text-gray-300 font-semibold mb-2">Tema</label>
                                    <input
                                        type="text"
                                        id="tema"
                                        value={newActivity.tema}
                                        onChange={(e) => setNewActivity({ ...newActivity, tema: e.target.value })}
                                        required
                                        className="w-full px-4 py-2 border rounded-lg bg-gray-800 border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="estado" className="block text-gray-300 font-semibold mb-2">Estado</label>
                                    <select
                                        id="estado"
                                        value={newActivity.estado}
                                        onChange={(e) => setNewActivity({ ...newActivity, estado: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg bg-gray-800 border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option>Pendiente</option>
                                        <option>En progreso</option>
                                        <option>Completado</option>
                                    </select>
                                </div>
                                <div className="flex justify-end space-x-4">
                                    <button type="button" onClick={() => setShowModal(false)} className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
                                        Cancelar
                                    </button>
                                    <button type="submit" className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                                        Guardar Actividad
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-black min-h-screen flex items-center justify-center p-4">
            <div id="main-container" className="bg-gray-900 rounded-xl shadow-2xl p-8 max-w-4xl w-full border border-gray-800">
                {renderView()}
            </div>
            {message && (
                <div className={`message-box ${messageType === 'success' ? 'message-success' : 'message-error'}`}>
                    {message}
                </div>
            )}
        </div>
    );
}
