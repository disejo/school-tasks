import { verifyToken } from '../api/auth';

export default async function withRole(Component, allowedRoles = []) {
  return function Wrapper(props) {
    // Este hook solo funciona en client components
    // Para server components, la verificación debe hacerse en el backend
    const [user, setUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const router = useRouter();

    React.useEffect(() => {
      async function checkRole() {
        setLoading(true);
        const userData = await verifyToken();
        if (!userData || !allowedRoles.includes(userData.role)) {
          router.push('/login');
        } else {
          setUser(userData);
        }
        setLoading(false);
      }
      checkRole();
    }, [router]);

    if (loading) return <div>Cargando...</div>;
    if (!user) return null;
    return <Component {...props} user={user} />;
  };
}
