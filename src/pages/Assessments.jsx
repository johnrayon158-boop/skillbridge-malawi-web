import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';

export default function Assessments(){
  const [list,setList]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(null);
  const fetchList = async ()=>{ setLoading(true); try{ const r=await fetch('/api/assessments'); const d=await r.json(); if(!r.ok) throw new Error(d.error||'Failed'); setList(d); }catch(e){ setError(e.message);} setLoading(false); };
  useEffect(()=>{ fetchList(); },[]);
  return <div><PageHeader eyebrow="Assessments" title="Available assessments" description="Take assessments to verify your skills." /><div className="panel">{loading? 'Loading…' : error ? <div className="error">{error}</div> : list.length ? list.map(a=><div key={a.id} className="list-item"><h4>{a.title}</h4><p>{a.category} · {a.questions_count} questions · {a.duration_minutes||'N/A'} min</p><div className="actions"><Button onClick={()=>window.location.hash='take-'+a.id}>Start</Button></div></div>) : <div className="empty">No assessments yet</div>}</div></div>;
}
