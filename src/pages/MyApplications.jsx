import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';

export default function MyApplications(){
  const { token } = useAuth();
  const [apps,setApps]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(null);
  const fetchApps = async ()=>{ setLoading(true); try{ const r=await fetch('/api/applications/my', { headers:{ Authorization:`Bearer ${token}` } }); const d=await r.json(); if(!r.ok) throw new Error(d.error||'Failed'); setApps(d); }catch(e){ setError(e.message);} setLoading(false); };
  useEffect(()=>{ if(token) fetchApps(); },[token]);
  const withdraw = async (id)=>{ if(!confirm('Withdraw application?')) return; await fetch('/api/applications/'+id, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } }); fetchApps(); };
  if(!token) return <div className="panel"><h3>Please log in</h3></div>;
  if(loading) return <div className="panel">Loading…</div>;
  return <div><PageHeader eyebrow="Applications" title="My applications" description="Track your applications and view timelines."/><div className="panel">{error&&<div className="error">{error}</div>}{apps.length?apps.map(a=><div className="app-row" key={a.id}><div><b>{a.job_title}</b><small>{a.company_name}</small><div className="meta">Applied {new Date(a.applied_at).toLocaleString()}</div></div><div><div className="status">{a.status}</div><div className="timeline">{a.events&&a.events.map(e=><div key={e.id}><small>{new Date(e.created_at).toLocaleString()}</small><div>{e.status_text}{e.note?': '+e.note:''}</div></div>)}</div><div className="actions"><Button variant="outline" onClick={()=>window.location.hash='job-'+a.job_id}>View job</Button>{a.status!=='hired'&&a.status!=='rejected'&&<Button variant="danger" onClick={()=>withdraw(a.id)}>Withdraw</Button>}</div></div></div>):<div className="empty">You have not applied to any jobs yet.</div>}</div></div>;
}
