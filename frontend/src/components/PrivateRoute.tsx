import { Navigate } from 'react-router-dom';

function isTokenExpired(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload?.exp) {
      return false;
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    return payload.exp < nowInSeconds;
  } catch {
    return true;
  }
}

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('@Estudio:token');

  if (!token || isTokenExpired(token)) {
    localStorage.removeItem('@Estudio:token');
    localStorage.removeItem('@Estudio:user');
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}