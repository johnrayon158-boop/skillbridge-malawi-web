import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';

export default function AdminDashboard(){
  const [stats,setStats]=useState(null);
  const [users,setUsers]=useState([]);
  const [q,setQ]=useState('');
  const [roleFilter,setRoleFilter]=useState('');

  const fetchStats = async ()=>{
    const r = await fetch('/api/admin/dashboard', { headers: { Authorization: `Bearer ${localStorage.getItem('sb_token')}` } });
    if (r.ok){ setStats(await r.json()); }
  };
  const fetchUsers = async ()=>{
    const params = new URLSearchParams(); if(q) params.set('q',q); if(roleFilter) params.set('role',roleFilter);
    const r = await fetch('/api/admin/users?'+params.toString(), { headers: { Authorization: `Bearer ${localStorage.getItem('sb_token')}` } });
    if (r.ok) setUsers(await r.json());
  };

  useEffect(()=>{ fetchStats(); fetchUsers(); },[]);

  const toggleActive = async (id,activate)=>{
    const url = `/api/admin/users/${id}/${activate? 'activate':'deactivate'}`;
    const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('sb_token')}` } });
    if (r.ok) fetchUsers();
  };

  return <div className="admin-page"><PageHeader eyebrow="Administrator" title="Admin dashboard" description="Manage users, content and moderation." />
    <div className="admin-grid"><div className="panel"><h3>Platform summary</h3>{stats? <div className="stats-grid">{Object.keys(stats).map(k=> <div key={k}><b>{stats[k]}</b><span>{k.replace(/_/g,' ')}</span></div>)}</div> : <p>Loading...</p>}</div>
    <div className="panel"><h3>User management</h3><div className="user-controls"><input placeholder="Search users" value={q} onChange={e=>setQ(e.target.value)}/><select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}><option value="">All roles</option><option value="student">Student</option><option value="graduate">Graduate</option><option value="employer">Employer</option></select><Button onClick={fetchUsers}>Search</Button></div>
    <div className="user-list">{users.map(u=> <div key={u.id} className="user-row"><div><b>{u.email}</b><small>{u.role}</small></div><div><small>{u.status}</small><Button variant="outline" onClick={()=>toggleActive(u.id, u.status!=='active')}>{u.status==='active'?'Deactivate':'Activate'}</Button></div></div>)}</div></div>
    </div></div>;
}
