import React, { useEffect } from 'react';
import { authService } from '@services/supabase/auth.service';
import { useAuthStore } from '@store/useAuthStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setLoading } = useAuthStore();

  useEffect(() => {
    authService.getSession()
      .then(setSession)
      .catch(() => setLoading(false));

    const { data: listener } = authService.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}