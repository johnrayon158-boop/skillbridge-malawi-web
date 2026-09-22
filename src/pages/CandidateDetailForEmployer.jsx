import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';

export default function CandidateDetailForEmployer({ jobId, candidateId }){
  const [data,setData]=useState(null);
  useEffect(()=>{ if(!jobId||!candidateId) return; (async ()=>{ const r=await fetch(`/api/matching/job/${jobId}/candidate/${candidateId}`, { headers:{ Authorization:`Bearer ${localStorage.getItem('sb_token')}` } }); const d=await r.json(); if(r.ok) setData(d); else alert(d.error||'Failed'); })(); },[jobId,candidateId]);
  if(!data) return <div className="panel">Loading…</div>;
  const { match, profile, skills, assessments, projects, education, experience } = data;
  return <div><PageHeader eyebrow="Candidate" title={profile.full_name||profile.email} description={profile.bio||''} /><div className="panel"><h3>Match: {match.score}%</h3><div><b>Breakdown</b><ul><li>Skill overlap: {Math.round(match.explanation.skillOverlap*100)}%</li><li>Proficiency: {Math.round(match.explanation.proficiencyScore*100)}%</li><li>Education compatibility: {Math.round(match.explanation.educationScore*100)}%</li><li>Assessments: {Math.round(match.explanation.assessmentScore*100)}%</li><li>Portfolio evidence: {Math.round(match.explanation.portfolioScore*100)}%</li></ul></div></div><div className="panel"><h3>Skills</h3>{skills.map(s=><div key={s.skill_id}><b>{s.skill_name}</b> {s.verified? '✓':''} · Level: {s.proficiency}</div>)}</div><div className="panel"><h3>Projects</h3>{projects.map(p=> <div key={p.id}><b>{p.title}</b><p>{p.description}</p></div>)}</div><div className="panel"><h3>Assessments</h3>{assessments.map(a=> <div key={a.id}><b>{a.id}</b> · Score: {a.score}</div>)}</div></div>;
}
