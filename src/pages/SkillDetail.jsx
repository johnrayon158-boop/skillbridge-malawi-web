import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';

export default function SkillDetail({ id }){
  const [skill,setSkill]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  useEffect(()=>{ if(!id) return; setLoading(true); fetch('/api/skills/'+id).then(r=>r.json()).then(d=>{ if(d.error) setError(d.error); else setSkill(d); setLoading(false); }).catch(e=>{ setError(e.message); setLoading(false);} ) },[id]);
  if(!id) return <div className="panel">Select a skill</div>;
  if(loading) return <div className="panel">Loading…</div>;
  if(error) return <div className="panel"><p className="error">{error}</p></div>;
  return <div><PageHeader eyebrow="Skill" title={skill.name} description={skill.category_name||''} /><div className="panel"><h3>Description</h3><p>{skill.description||'No description provided.'}</p></div></div>;
}
