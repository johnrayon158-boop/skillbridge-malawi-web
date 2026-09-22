import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { supabase } from '../lib/supabaseClient';
import { readableSupabaseError } from '../lib/supabaseData';

export default function Assessments(){
  const [list,setList]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(null);
  const fetchList = async ()=>{ setLoading(true); const { data,error }=await supabase.from('assessments').select('id,title,description,duration_minutes,assessment_questions(id)').eq('published',true).order('created_at',{ascending:false}); if(error) setError(readableSupabaseError(error,'Unable to load assessments.')); else setList((data||[]).map(item=>({...item,questions_count:item.assessment_questions?.length||0}))); setLoading(false); };
  useEffect(()=>{ fetchList(); },[]);
  return <div><PageHeader eyebrow="Assessments" title="Available assessments" description="Take assessments to verify your skills." /><div className="panel">{loading? 'Loading…' : error ? <div className="error">{error}</div> : list.length ? list.map(a=><div key={a.id} className="list-item"><h4>{a.title}</h4><p>{a.category} · {a.questions_count} questions · {a.duration_minutes||'N/A'} min</p><div className="actions"><Button onClick={()=>window.location.hash='take-'+a.id}>Start</Button></div></div>) : <div className="empty">No assessments yet</div>}</div></div>;
}
