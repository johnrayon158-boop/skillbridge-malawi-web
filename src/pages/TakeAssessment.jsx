import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';

export default function TakeAssessment({ id }){
  const [assessment,setAssessment]=useState(null); const [loading,setLoading]=useState(true); const [error,setError]=useState(null);
  const [attemptId,setAttemptId]=useState(null); const [answers,setAnswers]=useState({}); const [current,setCurrent]=useState(0); const [submitting,setSubmitting]=useState(false); const [result,setResult]=useState(null);
  useEffect(()=>{ if(!id) return; (async ()=>{ setLoading(true); const r=await fetch('/api/assessments/'+id); const d=await r.json(); if(!r.ok) setError(d.error||'Failed'); else setAssessment(d); setLoading(false); })(); },[id]);
  const start = async ()=>{ const r=await fetch('/api/assessments/'+id+'/start', { method:'POST', headers:{ Authorization:`Bearer ${localStorage.getItem('sb_token')}` } }); const d=await r.json(); if(!r.ok) return alert(d.error||'Start failed'); setAttemptId(d.attempt.id); };
  const setOption = (qid, oid)=>{ setAnswers(a=>({ ...a, [qid]: oid })); };
  const submit = async ()=>{ if(!attemptId) return alert('Start assessment first'); setSubmitting(true); const payload = { attemptId, answers: Object.keys(answers).map(qid=>({ question_id: qid, option_id: answers[qid] })) }; const r = await fetch('/api/assessments/'+id+'/submit', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('sb_token')}` }, body: JSON.stringify(payload) }); const d = await r.json(); if(!r.ok) { alert(d.error||'Submit failed'); setSubmitting(false); return; } setResult(d); setSubmitting(false); };
  if(loading) return <div className="panel">Loading…</div>;
  if(error) return <div className="panel"><div className="error">{error}</div></div>;
  const qs = assessment.questions;
  const q = qs[current];
  return <div><PageHeader eyebrow="Assessment" title={assessment.assessment.title} description={assessment.assessment.category} /><div className="panel">{attemptId? <div className="attempt-info">Attempt: {attemptId}</div> : <Button onClick={start}>Start assessment</Button>} {q && <div className="question-card"><h3>Q{current+1}. {q.text}</h3>{q.options.map(o=><div key={o.id}><label><input type="radio" name={q.id} checked={answers[q.id]===o.id} onChange={()=>setOption(q.id,o.id)}/> {o.text}</label></div>)}<div className="question-actions"><Button variant="outline" onClick={()=>setCurrent(Math.max(0,current-1))}>Previous</Button>{current<qs.length-1? <Button onClick={()=>setCurrent(current+1)}>Next</Button> : <Button onClick={submit}>{submitting? 'Submitting…':'Submit assessment'}</Button> }</div></div> }</div>{result && <div className="panel"><h3>Result</h3><p>Score: {result.scorePercent.toFixed(2)}%</p><p>Correct: {result.correctCount} / {result.totalQuestions}</p><div><h4>Skill breakdown</h4>{Object.entries(result.skillScores).map(([skill,stats])=> <div key={skill}><b>{skill}</b><div>{stats.correct}/{stats.total} → {((stats.correct/stats.total)*100).toFixed(1)}%</div></div>)}</div></div>}</div>;
}
