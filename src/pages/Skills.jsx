import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';

export default function Skills(){
  const [skills,setSkills]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [q,setQ]=useState('');

  const fetchSkills = async ()=>{
    setLoading(true); setError(null);
    try{ const res = await fetch('/api/skills?q='+encodeURIComponent(q)); const data=await res.json(); if(!res.ok) throw new Error(data.error||'Failed'); setSkills(data); }catch(err){ setError(err.message); } setLoading(false);
  };
  useEffect(()=>{ fetchSkills(); },[q]);

  return <div>
    <PageHeader eyebrow="Skills" title="Skill directory" description="Browse skills used across careers." action={<Button onClick={()=>{}}>＋ Add skill</Button>} />
    <div className="panel"><input placeholder="Search skills" value={q} onChange={e=>setQ(e.target.value)}/></div>
    <div className="panel">{loading? <p>Loading…</p> : error ? <p className="error">{error}</p> : skills.length ? <div className="list-grid">{skills.map(s=><div key={s.id} className="list-item"><h4>{s.name}</h4><p className="muted">{s.category_name||'Uncategorized'}</p><a href={'#skill-'+s.id}>View →</a></div>)}</div> : <div className="empty">No skills found</div>}</div>
  </div>;
}
