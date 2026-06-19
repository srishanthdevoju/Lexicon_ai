import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(true); // assume complete until proven otherwise

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        checkProfileComplete(currentSession.user);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          checkProfileComplete(currentSession.user);
        } else {
          setProfileComplete(true); // reset when logged out
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Check if the user's profile has been explicitly set up.
   * Google OAuth users won't have role in user_metadata, so we check Supabase profiles table.
   * If role is still the default 'lawyer' but there's no matching entry in the lawyers table,
   * the user needs to complete their profile.
   */
  const checkProfileComplete = async (currentUser) => {
    // Email signups always pass role in metadata — they are complete
    const provider = currentUser?.app_metadata?.provider;
    const metaRole = currentUser?.user_metadata?.role;

    if (provider === 'email' && metaRole) {
      setProfileComplete(true);
      return;
    }

    // For Google OAuth users, check if profile exists and has a role set explicitly
    if (provider === 'google') {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .single();

        if (error || !data) {
          // Profile doesn't exist yet (trigger may not have fired yet)
          setProfileComplete(false);
          return;
        }

        // If the user has user_metadata.role set, they've completed setup
        if (metaRole && (metaRole === 'lawyer' || metaRole === 'client')) {
          setProfileComplete(true);
          return;
        }

        // Default trigger sets role to 'lawyer' — if there's no explicit metadata role,
        // the user hasn't gone through role selection
        setProfileComplete(false);
      } catch {
        setProfileComplete(false);
      }
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard',
      },
    });
    if (error) throw error;
  };

  const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signUpWithEmail = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPasswordForEmail = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  /**
   * Called after Google OAuth role selection to update user metadata and mark profile as complete.
   */
  const updateUserRole = async (role, name) => {
    const { error } = await supabase.auth.updateUser({
      data: { role, name, full_name: name },
    });
    if (error) throw error;
    setProfileComplete(true);
  };

  const userRole = user?.user_metadata?.role || 'lawyer';

  const value = {
    user,
    session,
    loading,
    profileComplete,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    resetPasswordForEmail,
    updatePassword,
    updateUserRole,
    userRole,
    isAuthenticated: !!session,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
