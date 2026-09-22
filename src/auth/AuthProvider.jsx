import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }){
  const [user,setUser] = useState(null);
  const [token,setToken] = useState(localStorage.getItem('sb_token'));
  const [loading,setLoading] = useState(false);

  useEffect(()=>{
    let mounted = true;
    const load = async ()=>{
      if(!token){ setUser(null); localStorage.removeItem('sb_token'); setLoading(false); return; }
      setLoading(true);
      localStorage.setItem('sb_token', token);
      try{
        const r = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        const data = await r.json();
        if(!mounted) return;
        if(!data.error) setUser(data); else { setUser(null); setToken(null); localStorage.removeItem('sb_token'); }
      } catch(e){ if(mounted) setUser(null); }
      if(mounted) setLoading(false);
    };
    load();
    return ()=>{ mounted=false; };
  },[token]);

  const login = async (email,password)=>{
    const res = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password}) });
    const data = await res.json();
    if(res.ok && data.token){ setToken(data.token); setUser(data.user); return { ok:true, user: data.user }; }
    return { ok:false, error: data.error };
  };

  const register = async ({fullName,email,password,accountType,acceptTerms})=>{
    const res = await fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({fullName,email,password,accountType,acceptTerms}) });
    const data = await res.json();
    if(res.ok && data.token){ setToken(data.token); setUser(data.user); return { ok:true, user: data.user }; }
    return { ok:false, error: data.error };
  };

  const logout = ()=>{ setToken(null); setUser(null); localStorage.removeItem('sb_token'); };

  return <AuthContext.Provider value={{user, token, login, register, logout, loading, isAuthenticated: !!user}}>{children}</AuthContext.Provider>;
}

export const useAuth = ()=> useContext(AuthContext);
