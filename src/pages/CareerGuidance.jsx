import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';

export default function CareerGuidance(){
  const [recs,setRecs]=useState(null); const [running,setRunning]=useState(false);
  const [weights,setWeights]=useState({ academic_programme:0.25, skills:0.3, interests:0.2, assessments:0.15, preferences:0.1 });
  const run = async ()=>{
    setRunning(true);
    const r = await fetch('/api/career-guidance/recommend', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('sb_token')}` }, body: JSON.stringify({ weights }) });
    const d = await r.json(); setRunning(false); if(!r.ok) return alert(d.error||'Failed'); setRecs(d.recommendations);
  };
  return <div><PageHeader eyebrow="Career Guidance" title="Recommended careers" description="Explainable recommendations based on your profile, skills and assessments." /><div className="panel form-grid"><h4>Weights (adjust to preference)</h4><label>Academic programme<input type="number" step="0.01" value={weights.academic_programme} onChange={e=>setWeights(w=>({...w, academic_programme: parseFloat(e.target.value)||0}))}/></label><label>Skills<input type="number" step="0.01" value={weights.skills} onChange={e=>setWeights(w=>({...w, skills: parseFloat(e.target.value)||0}))}/></label><label>Interests<input type="number" step="0.01" value={weights.interests} onChange={e=>setWeights(w=>({...w, interests: parseFloat(e.target.value)||0}))}/></label><label>Assessments<input type="number" step="0.01" value={weights.assessments} onChange={e=>setWeights(w=>({...w, assessments: parseFloat(e.target.value)||0}))}/></label><label>Preferences<input type="number" step="0.01" value={weights.preferences} onChange={e=>setWeights(w=>({...w, preferences: parseFloat(e.target.value)||0}))}/></label><div className="form-actions"><Button onClick={run}>{running? 'Running…':'Get recommendations'}</Button></div></div>{recs && <div className="panel"><h3>Top recommendations</h3>{recs.map(r=><div key={r.career_id} className="rec"><h4>{r.career_title} — {r.score}%</h4><div><b>Why this career</b><ul>{r.explanation.academicScore>0.1 && <li>Your academic programme matches this field</li>}{r.explanation.skillsScore>0.1 && <li>You have skills relevant to this career</li>}{r.explanation.interestsScore>0.1 && <li>Your interests match</li>}{r.explanation.assessmentsScore>0.1 && <li>Your assessments show competency</li>}</ul></div><div><b>Skills to improve</b><ul>{r.explanation.skill_details.filter(s=>s.ratio<1).map(s=> <li key={s.skill_id}>{s.skill_name} — required {s.required_level}, effective {s.effective}{s.assessPercent? ` — assessment ${s.assessPercent}%`:''}</li>)}</ul></div></div>)}</div>}</div>;
}
