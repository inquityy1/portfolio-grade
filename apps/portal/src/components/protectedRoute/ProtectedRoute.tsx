import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import type { RootState } from '@portfolio-grade/app-state';

export default function ProtectedRoute() {
  const isAuthed = useSelector((s: RootState) => !!s.auth.token);

  if (!isAuthed) {
    return <Navigate to='/login' replace />;
  }
  return <Outlet />;
}
