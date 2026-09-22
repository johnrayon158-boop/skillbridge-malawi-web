import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { supabase } from '../lib/supabaseClient';
import { readableSupabaseError } from '../lib/supabaseData';

export default function LearningResources(){
  const [list,setList]=useState([]); const [skillFilter,setSkillFilter]=useState('');
  const fetchList = async ()=>{ let query=supabase.from('learning_resources').select('id,title,description,provider,url,resource_type,duration_minutes,learning_resource_skills(skill_id,skills(name))').eq('published',true).order('created_at',{ascending:false}); if(skillFilter) query=query.eq('learning_resource_skills.skill_id',skillFilter); const { data,error }=await query; if(error) alert(readableSupabaseError(error,'Unable to load resources.')); else setList(data||[]); };
  useEffect(()=>{ fetchList(); },[skillFilter]);
  const save = async (id,status='saved')=>{ const {data:{user}}=await supabase.auth.getUser(); if(!user){window.location.hash='login';return;} const {error}=await supabase.from('user_learning_progress').upsert({user_id:user.id,resource_id:id,status,progress_percent:status==='completed'?100:0},{onConflict:'user_id,resource_id'}); if(error) alert(readableSupabaseError(error,'Unable to update learning progress.')); };
  return <div><PageHeader eyebrow="Resources" title="Learning resources" description="Browse verified learning content." /><div className="panel form-grid"><label>Skill filter<input value={skillFilter} onChange={e=>setSkillFilter(e.target.value)} placeholder="skill id"/></label><div className="form-actions"><Button onClick={fetchList}>Refresh</Button></div></div><div className="panel"><h3>Resources</h3>{list.length? list.map(r=> <div key={r.id} className="resource"><h4>{r.title}</h4><div>{r.provider} · {r.resource_type} · {r.duration_minutes||'N/A'} min</div><p>{r.description}</p><div className="actions"><Button onClick={()=>window.open(r.url,'_blank')}>Open</Button><Button onClick={()=>save(r.id)}>Save</Button><Button variant="outline" onClick={()=>save(r.id,'completed')}>Mark completed</Button></div></div>) : <div>No resources</div>}</div></div>;
}
