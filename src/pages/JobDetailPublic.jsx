import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';

export default function JobDetailPublic({ id }){
  const [job,setJob]=useState(null); const [loading,setLoading]=useState(true); const [error,setError]=useState(null);
  const [applying,setApplying]=useState(false); const [cover,setCover]=useState(''); const [projects,setProjects]=useState([]); const [certs,setCerts]=useState([]); const [selectedProject,setSelectedProject]=useState(''); const [selectedCert,setSelectedCert]=useState('');
  useEffect(()=>{ if(!id) return; (async ()=>{ setLoading(true); const r=await fetch('/api/jobs/'+id); const d=await r.json(); if(!r.ok) setError(d.error||'Failed'); else setJob(d); setLoading(false); })(); },[id]);
  useEffect(()=>{ (async ()=>{ try{ const r=await fetch('/api/profile', { headers: { Authorization: `Bearer ${localStorage.getItem('sb_token')}` } }); const d=await r.json(); if(r.ok){ setProjects(d.projects||[]); setCerts(d.certificates||[]); } } catch(e){} })(); },[]);
  if(!id) return <div className="panel">Select a job</div>;
  if(loading) return <div className="panel">Loading…</div>;
  if(error) return <div className="panel"><div className="error">{error}</div></div>;
  const submitApplication = async ()=>{
    try{ setApplying(true); const payload = { jobId: id, cover_letter: cover, portfolio_project_id: selectedProject || null, portfolio_certificate_id: selectedCert || null }; const res = await fetch('/api/applications', { method: 'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${localStorage.getItem('sb_token')}` }, body: JSON.stringify(payload) }); const j = await res.json(); if(!res.ok) throw new Error(j.error||'Apply failed'); alert('Application submitted'); window.location.hash='applications'; }catch(e){ alert(e.message); } finally{ setApplying(false); } };

  return <div><PageHeader eyebrow="Job" title={job.title} description={job.company_name} /><div className="panel"><h3>About this job</h3><p>{job.description}</p><div className="meta">{job.location} · {job.type}</div><div className="job-skills"><h4>Required skills</h4></div>{/* Apply form */}<div className="apply-panel"><h4>Apply for this role</h4><label>Cover letter<textarea value={cover} onChange={e=>setCover(e.target.value)} /></label><label>Attach project (optional)<select value={selectedProject} onChange={e=>setSelectedProject(e.target.value)}><option value="">— none —</option>{projects.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></label><label>Attach certificate (optional)<select value={selectedCert} onChange={e=>setSelectedCert(e.target.value)}><option value="">— none —</option>{certs.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label><div className="form-actions"><Button onClick={submitApplication} disabled={applying}>{applying? 'Applying…':'Apply now'}</Button><Button variant="outline" onClick={()=>alert('Saved')}>Save job</Button></div></div></div></div>;
}
