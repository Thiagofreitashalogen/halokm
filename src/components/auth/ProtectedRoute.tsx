import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useGoogleAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Additional security: check if user email is from halogen.no domain
  if (!user.email?.endsWith('@halogen.no')) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
