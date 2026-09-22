import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';

export default function RecommendedResources(){
  const [result,setResult]=useState(null); const [resources,setResources]=useState([]); const [loading,setLoading]=useState(false);
  const run = async ()=>{ setLoading(true); // call skills-gap for selected career or default last career in list
    const careerId = window.localStorage.getItem('lastCareerId'); if(!careerId){ alert('Run skill-gap first and pick a career'); setLoading(false); return; }
    const r = await fetch('/api/skills-gap/'+careerId, { headers: { Authorization: `Bearer ${localStorage.getItem('sb_token')}` } }); const d = await r.json(); if(!r.ok){ alert(d.error||'Failed'); setLoading(false); return; }
    setResult(d); // collect missing skills and fetch learning resources
    const skillIds = d.missing.map(m=>m.skill_id);
    if (skillIds.length){ const q = '?skill_id='+skillIds[0]; // simple: fetch by first missing skill
      const rr = await fetch('/api/learning-resources'+q); const dd = await rr.json(); if(rr.ok) setResources(dd); }
    setLoading(false);
  };
  return <div><PageHeader eyebrow="Recommended" title="Recommended learning resources" description="Resources matched to your skill gaps." /><div className="panel form-grid"><div className="form-actions"><Button onClick={run}>{loading? 'Loading…':'Get recommended resources'}</Button></div></div>{result && <div className="panel"><h3>Missing skills</h3><ul>{result.missing.map(m=> <li key={m.skill_id}>{m.skill_name}</li>)}</ul></div>}<div className="panel"><h3>Resources</h3>{resources.map(r=> <div key={r.id}><h4>{r.title}</h4><p>{r.provider}</p><Button onClick={()=>window.open(r.url,'_blank')}>Open</Button></div>)}</div></div>;
}
