import { Navigate } from 'react-router-dom';

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('@Estudio:token');

  // Se não houver token, redireciona para o login
  if (!token) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}