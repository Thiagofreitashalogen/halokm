import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface GoogleAuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  accessToken: string | null;
  isGoogleConnected: boolean;
}

export function useGoogleAuth() {
  const [state, setState] = useState<GoogleAuthState>({
    user: null,
    session: null,
    isLoading: true,
    accessToken: null,
    isGoogleConnected: false,
  });

  useEffect(() => {
    // Helper function to extract provider_token from localStorage as fallback
    const getProviderTokenFromStorage = (): string | null => {
      try {
        const storageKey = `sb-${import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`;
        const storedSession = localStorage.getItem(storageKey);
        if (storedSession) {
          const parsed = JSON.parse(storedSession);
          return parsed?.provider_token || null;
        }
      } catch (error) {
        console.error('Error reading provider_token from localStorage:', error);
      }
      return null;
    };

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const providerToken = session?.provider_token || getProviderTokenFromStorage();
        console.log('Auth state changed:', {
          event,
          hasSession: !!session,
          hasProviderToken: !!providerToken,
          user: session?.user?.email
        });
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          accessToken: providerToken,
          isGoogleConnected: !!providerToken,
          isLoading: false,
        }));
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const providerToken = session?.provider_token || getProviderTokenFromStorage();
      console.log('Google Auth - Session loaded:', {
        hasSession: !!session,
        hasProviderTokenInSession: !!session?.provider_token,
        hasProviderTokenInStorage: !!getProviderTokenFromStorage(),
        finalProviderToken: !!providerToken,
        providerToken: providerToken?.substring(0, 20) + '...',
        user: session?.user?.email
      });
      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        accessToken: providerToken,
        isGoogleConnected: !!providerToken,
        isLoading: false,
      }));
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const redirectUrl = `${window.location.origin}${window.location.pathname}`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        scopes: 'https://www.googleapis.com/auth/drive.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }, []);

  const refreshToken = useCallback(async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
    return data.session?.provider_token ?? null;
  }, []);

  return {
    ...state,
    signInWithGoogle,
    signOut,
    refreshToken,
  };
}
