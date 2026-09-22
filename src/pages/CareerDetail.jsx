import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { supabase } from '../lib/supabaseClient';
import { readableSupabaseError } from '../lib/supabaseData';

export default function CareerDetail({ id }){
  const [career,setCareer]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  useEffect(()=>{ if(!id) return; (async()=>{ setLoading(true); const {data,error:queryError}=await supabase.from('careers').select('id,title,description,career_skills(id,required_level,importance,skills(id,name)),career_categories(name)').eq('id',id).maybeSingle(); if(queryError) setError(readableSupabaseError(queryError,'Unable to load career.')); else if(data) setCareer({career:data,skills:(data.career_skills||[]).map(item=>({id:item.id,skill_name:item.skills?.name,required_level:item.required_level})),related:[]}); setLoading(false); })(); },[id]);
  if(!id) return <div className="panel">Select a career</div>;
  if(loading) return <div className="panel">Loading…</div>;
  if(error) return <div className="panel"><p className="error">{error}</p></div>;
  if(!career) return <div className="panel"><p className="empty">Career not found.</p></div>;
  return <div>
    <PageHeader eyebrow="Career" title={career.career.title} description={career.career.description||''} />
    <div className="panel"><h3>Required skills</h3>{career.skills.length?career.skills.map(s=><div key={s.id} className="skill-req"><b>{s.skill_name}</b><small>Level {s.required_level||'—'}</small></div>):<div className="empty">No required skills defined</div>}</div>
    <div className="panel"><h3>Related careers</h3>{career.related&&career.related.length?career.related.map(r=><div key={r.title}><a href={'#career-'+r.related_career_id}>{r.title}</a></div>):<div className="empty">No related careers</div>}</div>
  </div>;
}
