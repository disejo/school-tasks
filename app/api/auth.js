
export async function loginWithDni(dni) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dni }),
    });
    const data = await res.json();
    if (data.success) {
      return { success: true, role: data.role, name: data.name };
    }
    return { success: false, error: 'Acceso denegado' };
  } catch {
    return { success: false, error: 'Error de red' };
  }
}

export async function verifyToken() {
  try {
    const res = await fetch('/api/auth/verify', {
      method: 'GET',
      credentials: 'include',
    });
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}
