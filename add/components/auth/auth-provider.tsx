'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { notifyTelegramLogin, notifyTelegramRegistration } from '@/lib/telegram';
import type { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  role: string;
  avatar_url: string | null;
  division?: string | null;
  district?: string | null;
  city?: string | null;
  thana?: string | null;
  area?: string | null;
  landmark?: string | null;
  is_active?: boolean;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (uid: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    setProfile(data as Profile | null);
  }, []);

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) await fetchProfile(u.id);
        else setProfile(null);
        setLoading(false);
      })();
    });
  }, [fetchProfile]);

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone } },
      });
      if (error) return { error: error.message };
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName,
          phone,
          email,
          role: 'customer',
        }, { onConflict: 'id' });
        notifyTelegramRegistration({ customer_name: fullName, user_email: email, user_phone: phone });
        if (data.session) {
          setUser(data.user);
          await fetchProfile(data.user.id);
        }
      }
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Unable to connect. Please try again.' };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (data.user) {
      await fetchProfile(data.user.id);
      const { data: profileData } = await supabase.from('profiles').select('full_name, phone').eq('id', data.user.id).maybeSingle();
      notifyTelegramLogin({ customer_name: profileData?.full_name || 'Unknown', user_email: email, user_phone: profileData?.phone });
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
