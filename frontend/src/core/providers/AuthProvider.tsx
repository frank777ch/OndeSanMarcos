import React, { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { authService } from '@services/supabase/auth.service';
import { supabase } from '@services/supabase/client';
import { useAuthStore } from '@store/useAuthStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setLoading } = useAuthStore();

  useEffect(() => {
    authService.getSession()
      .then(setSession)
      .catch(() => setLoading(false));

    const { data: listener } = authService.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
      }
    );

    const handleUrl = async (url: string) => {
      const { queryParams } = Linking.parse(url);
      const code = queryParams?.code as string | undefined;
      if (!code) return;
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) setSession(data.session);
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });
    const sub = Linking.addEventListener('url', ({ url }) => {
      void handleUrl(url);
    });

    return () => {
      listener.subscription.unsubscribe();
      sub.remove();
    };
  }, []);

  return <>{children}</>;
}
