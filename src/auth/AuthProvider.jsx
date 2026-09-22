import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }){
  const [session,setSession] = useState(null);
  const [user,setUser] = useState(null);
  const [profile,setProfile] = useState(null);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    let mounted = true;
    const loadProfile = async (nextSession)=>{
      if(!nextSession){
        if(mounted){ setSession(null); setUser(null); setProfile(null); setLoading(false); }
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', nextSession.user.id)
        .maybeSingle();
      if(!mounted) return;
      setSession(nextSession);
      setUser(data ? { ...nextSession.user, role: data.role } : null);
      setProfile(data || null);
      setLoading(false);
    };
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => loadProfile(currentSession));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      loadProfile(nextSession);
    });
    return ()=>{ mounted=false; subscription.unsubscribe(); };
  },[]);

  const login = async (email,password)=>{
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if(error) return { ok:false, error: getAuthError(error) };
    const { data: profileData } = await supabase.from('profiles').select('*').eq('user_id', data.user.id).maybeSingle();
    if(!profileData) return { ok:false, error:'Your account profile is missing. Please contact support.' };
    return { ok:true, user: { ...data.user, role: profileData.role }, profile: profileData };
  };

  const register = async ({fullName,email,password,accountType,acceptTerms,institution,programme,careerInterests,companyName,companyType})=>{
    if(!acceptTerms) return { ok:false, error:'Terms must be accepted' };
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: {
        role: accountType,
        full_name: fullName.trim(),
        institution: institution?.trim(),
        programme: programme?.trim(),
        career_interests: careerInterests || [],
        company_name: companyName?.trim(),
        company_type: companyType?.trim()
      } }
    });
    if(error) return { ok:false, error: getAuthError(error) };
    return { ok:true, user: data.user, needsEmailConfirmation: !data.session };
  };

  const logout = async ()=>{ await supabase.auth.signOut(); };
  const resetPassword = async (email)=>{
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
    return error ? { ok:false, error:getAuthError(error) } : { ok:true };
  };

  return <AuthContext.Provider value={{user, session, profile, token:session?.access_token || null, login, register, logout, resetPassword, loading, isAuthenticated: !!session && !!profile}}>{children}</AuthContext.Provider>;
}

function getAuthError(error){
  const message = error?.message?.toLowerCase() || '';
  if(message.includes('invalid login credentials')) return 'Email or password is incorrect.';
  if(message.includes('already registered') || message.includes('already been registered')) return 'An account with this email already exists.';
  if(message.includes('password')) return 'Password must be at least 6 characters.';
  if(message.includes('email')) return 'Please enter a valid email address.';
  if(message.includes('network') || message.includes('fetch')) return 'Unable to connect. Check your internet connection and try again.';
  return 'We could not complete that request. Please try again.';
}

export const useAuth = ()=> useContext(AuthContext);
