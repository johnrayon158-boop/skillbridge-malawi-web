import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { supabase } from '../lib/supabaseClient';
import { readableSupabaseError } from '../lib/supabaseData';

export default function SkillDetail({ id }){
  const [skill,setSkill]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  useEffect(()=>{ if(!id) return; (async()=>{ setLoading(true); const {data,error:queryError}=await supabase.from('skills').select('id,name,description,skill_type,difficulty_level,skill_categories(name)').eq('id',id).maybeSingle(); if(queryError) setError(readableSupabaseError(queryError,'Unable to load skill.')); else if(data) setSkill({...data,category_name:data.skill_categories?.name}); setLoading(false); })(); },[id]);
  if(!id) return <div className="panel">Select a skill</div>;
  if(loading) return <div className="panel">Loading…</div>;
  if(error) return <div className="panel"><p className="error">{error}</p></div>;
  if(!skill) return <div className="panel"><p className="empty">Skill not found.</p></div>;
  return <div><PageHeader eyebrow="Skill" title={skill.name} description={skill.category_name||''} /><div className="panel"><h3>Description</h3><p>{skill.description||'No description provided.'}</p></div></div>;
}
