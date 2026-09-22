import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { supabase } from '../lib/supabaseClient';
import { readableSupabaseError } from '../lib/supabaseData';

export default function AdminDashboard(){
  const [stats,setStats]=useState(null);
  const [users,setUsers]=useState([]);
  const [q,setQ]=useState('');
  const [roleFilter,setRoleFilter]=useState('');
  const [error,setError]=useState(null);

  const fetchStats = async ()=>{
    const tables=['profiles','institutions','programmes','skills','careers','jobs','applications','assessments']; const values={};
    for(const table of tables){ const { count, error:queryError }=await supabase.from(table).select('id',{count:'exact',head:true}); if(queryError) throw queryError; values[table]=count||0; }
    setStats({total_users:values.profiles,students:await countRole('student'),graduates:await countRole('graduate'),employers:await countRole('employer'),institutions:values.institutions,programmes:values.programmes,skills:values.skills,careers:values.careers,jobs:values.jobs,applications:values.applications,assessments:values.assessments});
  };
  const countRole = async role=>{ const { count, error }=await supabase.from('profiles').select('id',{count:'exact',head:true}).eq('role',role); if(error) throw error; return count||0; };
  const fetchUsers = async ()=>{
    const params = new URLSearchParams(); if(q) params.set('q',q); if(roleFilter) params.set('role',roleFilter);
    let query=supabase.from('profiles').select('id,user_id,email,role,status,created_at').order('created_at',{ascending:false}).limit(200); if(q) query=query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`); if(roleFilter) query=query.eq('role',roleFilter); const { data,error:queryError }=await query; if(queryError) throw queryError; setUsers(data||[]);
  };

  useEffect(()=>{ (async()=>{try{setError(null);await fetchStats();await fetchUsers();}catch(queryError){console.error(queryError);setError('Unable to load admin data. Check your Supabase permissions.');}})(); },[]);

  const toggleActive = async (id,activate)=>{
    const { error }=await supabase.from('profiles').update({status:activate?'active':'inactive'}).eq('id',id); if(error) alert(readableSupabaseError(error,'Unable to update user status.')); else fetchUsers();
  };

  return <div className="admin-page"><PageHeader eyebrow="Administrator" title="Admin dashboard" description="Manage users, content and moderation." />
    <div className="admin-grid">{error&&<div className="panel error">{error}</div>}<div className="panel"><h3>Platform summary</h3>{stats? <div className="stats-grid">{Object.keys(stats).map(k=> <div key={k}><b>{stats[k]}</b><span>{k.replace(/_/g,' ')}</span></div>)}</div> : <p>Loading...</p>}</div>
    <div className="panel"><h3>User management</h3><div className="user-controls"><input placeholder="Search users" value={q} onChange={e=>setQ(e.target.value)}/><select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}><option value="">All roles</option><option value="student">Student</option><option value="graduate">Graduate</option><option value="employer">Employer</option></select><Button onClick={fetchUsers}>Search</Button></div>
    <div className="user-list">{users.map(u=> <div key={u.id} className="user-row"><div><b>{u.email}</b><small>{u.role}</small></div><div><small>{u.status}</small><Button variant="outline" onClick={()=>toggleActive(u.id, u.status!=='active')}>{u.status==='active'?'Deactivate':'Activate'}</Button></div></div>)}</div></div>
    </div></div>;
}
