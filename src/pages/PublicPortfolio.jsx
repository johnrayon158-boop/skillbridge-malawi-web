import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';

export default function PublicPortfolio({ id }){
  const [data,setData]=useState(null);
  useEffect(()=>{ if(!id) return; (async ()=>{ const r=await fetch('/api/portfolio/public/'+id); const d=await r.json(); if(r.ok) setData(d); })(); },[id]);
  if(!data) return <div className="panel">Loading…</div>;
  const { user, education, skills, experiences, certificates, projects, assessments } = data;
  return <div><PageHeader eyebrow="Portfolio" title={user.full_name||user.email} description={user.bio||''} /><div className="panel"><h3>Profile</h3><div>Programme: {user.programme}</div><div>Location: {user.location}</div></div><div className="panel"><h3>Education</h3>{education.map(e=><div key={e.id}><b>{e.program_name||e.degree}</b><div>{e.institution_name}</div></div>)}</div><div className="panel"><h3>Skills</h3>{skills.map(s=><div key={s.skill_id}><b>{s.skill_name}</b> {s.verified? <small>✓ Verified</small>:''} <div>Level: {s.proficiency}</div></div>)}</div><div className="panel"><h3>Projects</h3>{projects.map(p=><div key={p.id}><h4>{p.title}</h4><p>{p.description}</p><div>{p.github_url && <a href={p.github_url} target="_blank" rel="noreferrer">GitHub</a>}{p.url && <a href={p.url} target="_blank" rel="noreferrer">Project</a>}</div></div>)}</div><div className="panel"><h3>Certificates</h3>{certificates.map(c=><div key={c.id}><b>{c.title}</b><div>{c.issuer}</div></div>)}</div><div className="panel"><h3>Experience</h3>{experiences.map(x=><div key={x.id}><b>{x.title}</b><div>{x.organization}</div></div>)}</div><div className="panel"><h3>Assessment summary</h3><div>Average score: {assessments.avg_score? Number(assessments.avg_score).toFixed(1)+'%':'N/A'}</div><div>Attempts: {assessments.attempts}</div></div></div>;
}
