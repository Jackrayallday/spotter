import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="min-h-screen" aria-busy="true" />;
  }

  if (!user) {
    const redirectTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`} replace />;
  }

  return <>{children}</>;
}
