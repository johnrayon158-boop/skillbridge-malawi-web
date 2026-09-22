import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';

export default function EmployerJobs(){
  const { token } = useAuth();
  const [jobs,setJobs]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(null);
  const fetchJobs = async ()=>{ setLoading(true); try{ const r=await fetch('/api/jobs?company=', { headers: { Authorization:`Bearer ${token}` } }).catch(()=>null); // public list ok
    const d = r? await r.json() : []; setJobs(d); }catch(e){ setError(e.message);} setLoading(false); };
  useEffect(()=>{ if(token) fetchJobs(); },[token]);
  const remove = async (id)=>{ if(!confirm('Delete job?')) return; await fetch('/api/jobs/'+id,{ method:'DELETE', headers:{ Authorization:`Bearer ${token}` } }); fetchJobs(); };
  const publish = async (id)=>{ await fetch('/api/jobs/'+id+'/publish', { method:'POST', headers:{ Authorization:`Bearer ${token}` } }); fetchJobs(); };
  const closeJob = async (id)=>{ await fetch('/api/jobs/'+id+'/close', { method:'POST', headers:{ Authorization:`Bearer ${token}` } }); fetchJobs(); };
  if(!token) return <div className="panel"><h3>Please log in</h3></div>;
  if(loading) return <div className="panel">Loading…</div>;
  return <div><PageHeader eyebrow="Jobs" title="Manage jobs" description="Create, edit and publish job postings." action={<Button onClick={()=>window.location.hash='post-job'}>＋ New job</Button>} /><div className="panel">{error&&<div className="error">{error}</div>}{jobs.length?jobs.map(j=><div className="job-row" key={j.id}><div><b>{j.title}</b><small>{j.company_name}</small><div>{j.location} · {j.type}</div></div><div className="job-actions"><Button variant="outline" onClick={()=>window.location.hash='post-job'}>Edit</Button>{j.status!=='published'?<Button onClick={()=>publish(j.id)}>Publish</Button>:<Button onClick={()=>closeJob(j.id)}>Close</Button>}<Button variant="danger" onClick={()=>remove(j.id)}>Delete</Button></div></div>):<div className="empty">No jobs yet</div>}</div></div>;
}
