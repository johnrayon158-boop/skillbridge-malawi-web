import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { supabase } from '../lib/supabaseClient';
import { readableSupabaseError } from '../lib/supabaseData';

export default function Assessments(){
  const [list,setList]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(null); const [category,setCategory]=useState('');
  const fetchList = async ()=>{ setLoading(true); setError(null); const { data,error:queryError }=await supabase.from('assessments').select('id,title,description,duration_minutes,assessment_categories(name),assessment_questions(id)').eq('published',true).order('created_at',{ascending:false}); if(queryError) setError(readableSupabaseError(queryError,'Unable to load assessments.')); else setList((data||[]).map(item=>({...item,category:item.assessment_categories?.name||'General',questions_count:item.assessment_questions?.length||0}))); setLoading(false); };
  useEffect(()=>{ fetchList(); },[]);
  const categories=[...new Set(list.map(item=>item.category))]; const visible=list.filter(item=>!category||item.category===category);
  return <div><PageHeader eyebrow="Skills assessment" title="Test and verify your skills" description="Complete assessments to strengthen your competency profile."/><div className="assessment-tabs"><Badge tone="blue">Available assessments</Badge><span>My results</span><select value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option>{categories.map(item=><option key={item} value={item}>{item}</option>)}</select></div>{error&&<div className="panel error">{error}</div>}{loading?<div className="panel">Loading assessments…</div>:visible.length?<div className="assessment-list">{visible.map((assessment,index)=><div className="assessment-card" key={assessment.id}><div className="assessment-icon">{index%3===0?'◈':index%3===1?'✓':'▤'}</div><div><h3>{assessment.title}</h3><p>{assessment.category} · {assessment.questions_count} questions · {assessment.duration_minutes||'Self-paced'}{assessment.duration_minutes?' min':''}</p></div><Badge tone="soft">Available</Badge><Button onClick={()=>window.location.hash='take-'+assessment.id}>Start →</Button></div>)}</div>:<div className="panel empty">No assessments found.</div>}</div>;
}
