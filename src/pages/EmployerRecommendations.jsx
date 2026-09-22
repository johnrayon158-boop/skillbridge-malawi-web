import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';

export default function EmployerRecommendations({ id }){
  const [recs,setRecs]=useState([]); const [loading,setLoading]=useState(true);
  useEffect(()=>{ if(!id) return; (async ()=>{ setLoading(true); const r=await fetch('/api/matching/job/'+id+'/recommendations', { headers: { Authorization:`Bearer ${localStorage.getItem('sb_token')}` } }); const d=await r.json(); if(r.ok) setRecs(d.recommendations); else alert(d.error||'Failed'); setLoading(false); })(); },[id]);
  return <div><PageHeader eyebrow="Recommendations" title="Candidate recommendations" description="Explainable candidate matches for this job." /><div className="panel">{loading? 'Loading…' : recs.length? recs.map(r=> <div key={r.candidateId} className="rec"><h4>{r.candidate && (r.candidate.full_name || r.candidate.email)} — {r.score}%</h4><div><b>Top reasons</b><ul>{r.explanation.skillDetails && r.explanation.skillDetails.filter(s=>s.ratio>=1).slice(0,3).map(s=> <li key={s.skill_id}>{s.skill_name}</li>)}</ul></div><div className="actions"><Button onClick={()=>window.location.hash='candidate-'+id+'-'+r.candidateId}>View candidate</Button></div></div>) : <div>No recommendations</div>}</div></div>;
}
