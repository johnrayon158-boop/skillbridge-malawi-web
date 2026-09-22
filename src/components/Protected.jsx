import React from 'react';
import { useAuth } from '../auth/AuthProvider';

export default function Protected({ allowedRoles, children }){
  const { user, loading } = useAuth();
  if(loading) return <div className="loading">Checking authentication…</div>;
  if(!user){ window.location.hash = 'login'; return null; }
  if(allowedRoles && allowedRoles.length && !allowedRoles.includes(user.role)){
    if(user.role === 'admin') window.location.hash = 'admin';
    else if(user.role === 'employer') window.location.hash = 'employer';
    else window.location.hash = 'dashboard';
    return null;
  }
  return <>{children}</>;
}
