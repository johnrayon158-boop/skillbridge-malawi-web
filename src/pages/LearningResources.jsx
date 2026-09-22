import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';

export default function LearningResources(){
  const [list,setList]=useState([]); const [skillFilter,setSkillFilter]=useState('');
  const fetchList = async ()=>{ const q = skillFilter? '?skill_id='+skillFilter : ''; const r=await fetch('/api/learning-resources'+q); const d=await r.json(); if(r.ok) setList(d); };
  useEffect(()=>{ fetchList(); },[skillFilter]);
  const save = async (id)=>{ const r=await fetch('/api/learning-resources/'+id+'/save',{ method:'POST', headers:{ Authorization:`Bearer ${localStorage.getItem('sb_token')}`, 'Content-Type':'application/json' }, body: JSON.stringify({}) }); const d=await r.json(); if(r.ok) alert('Saved'); else alert(d.error||'Failed'); };
  const complete = async (id)=>{ const r=await fetch('/api/learning-resources/'+id+'/complete',{ method:'POST', headers:{ Authorization:`Bearer ${localStorage.getItem('sb_token')}`, 'Content-Type':'application/json' }, body: JSON.stringify({}) }); const d=await r.json(); if(r.ok) alert('Marked completed'); else alert(d.error||'Failed'); };
  return <div><PageHeader eyebrow="Resources" title="Learning resources" description="Browse verified learning content." /><div className="panel form-grid"><label>Skill filter<input value={skillFilter} onChange={e=>setSkillFilter(e.target.value)} placeholder="skill id"/></label><div className="form-actions"><Button onClick={fetchList}>Refresh</Button></div></div><div className="panel"><h3>Resources</h3>{list.length? list.map(r=> <div key={r.id} className="resource"><h4>{r.title}</h4><div>{r.provider} · {r.kind} · {r.duration_minutes||'N/A'} min</div><p>{r.description}</p><div className="actions"><Button onClick={()=>window.open(r.url,'_blank')}>Open</Button><Button onClick={()=>save(r.id)}>Save</Button><Button variant="outline" onClick={()=>complete(r.id)}>Mark completed</Button></div></div>) : <div>No resources</div>}</div></div>;
}
