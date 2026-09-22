import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';

export default function ApplicantDetail({ id }){
  const [data,setData]=useState(null); const [loading,setLoading]=useState(true); const [error,setError]=useState(null);
  useEffect(()=>{ if(!id) return; (async ()=>{ setLoading(true); const r=await fetch('/api/applications/'+id, { headers: { Authorization: `Bearer ${localStorage.getItem('sb_token')}` } }); const d=await r.json(); if(!r.ok) setError(d.error||'Failed'); else setData(d); setLoading(false); })(); },[id]);
  if(!id) return <div className="panel">Select an application</div>;
  if(loading) return <div className="panel">Loading…</div>;
  if(error) return <div className="panel"><div className="error">{error}</div></div>;
  const { user, profile, skills, education, projects, certificates, assessments, application, events } = data;
  return <div><PageHeader eyebrow="Applicant" title={user.email} description={profile?.full_name||''} /><div className="panel"><h3>Profile</h3><p>{profile?.bio}</p><h4>Education</h4>{education.map(e=><div key={e.id}><b>{e.degree}</b><div>{e.institution_name}</div></div>)}<h4>Skills</h4>{skills.map(s=><div key={s.id}><b>{s.skill_name}</b><div>{s.proficiency?`Level ${s.proficiency}`:''} {s.years_experience?`· ${s.years_experience} yrs`:''}</div></div>)}<h4>Projects</h4>{projects.map(p=><div key={p.id}><b>{p.title}</b><p>{p.description}</p></div>)}<h4>Certificates</h4>{certificates.map(c=><div key={c.id}><b>{c.title}</b><small>{c.issuer}</small></div>)}<h4>Assessment answers</h4>{assessments.length?assessments.map(a=><div key={a.id}><div>{a.answer_text}</div></div>):<div className="empty">No assessment answers</div>}<h4>Application timeline</h4>{events.map(ev=><div key={ev.id}><small>{new Date(ev.created_at).toLocaleString()}</small><div>{ev.status_text}{ev.note?': '+ev.note:''}</div></div>)}</div></div>;
}
