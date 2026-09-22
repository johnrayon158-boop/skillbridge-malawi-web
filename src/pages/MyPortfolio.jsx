import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabaseClient';
import { readableSupabaseError } from '../lib/supabaseData';

export default function MyPortfolio(){
  const { user } = useAuth();
  const [list,setList]=useState([]);
  const [error,setError]=useState(null);
  const fetchList = async ()=>{ const { data:portfolio,error:portfolioError }=await supabase.from('portfolios').select('id,portfolio_projects(*)').eq('user_id',user.id).maybeSingle(); if(portfolioError) setError(readableSupabaseError(portfolioError,'Unable to load portfolio.')); else setList(portfolio?.portfolio_projects||[]); };
  useEffect(()=>{ fetchList(); },[]);
  const del = async (id)=>{ if(!confirm('Delete project?')) return; const {error:deleteError}=await supabase.from('portfolio_projects').delete().eq('id',id); if(deleteError) setError(readableSupabaseError(deleteError,'Unable to delete project.')); else fetchList(); };
  const publish = async (id,isPublished)=>{ const {error:updateError}=await supabase.from('portfolio_projects').update({is_published:isPublished}).eq('id',id); if(updateError) setError(readableSupabaseError(updateError,'Unable to update project.')); else fetchList(); };
  return <div><PageHeader eyebrow="Portfolio" title="My projects" description="Manage your professional portfolio." /><div className="panel"><div className="actions"><Button onClick={()=>window.location.hash='project-new'}>Add project</Button></div>{error&&<div className="error">{error}</div>}{list.length? list.map(p=><div key={p.id} className="project"><h4>{p.title} {p.is_published? <small>· Published</small>:''}</h4><p>{p.description}</p><div><Button onClick={()=>window.location.hash='project-'+p.id}>Edit</Button><Button onClick={()=>del(p.id)}>Delete</Button><Button onClick={()=>publish(p.id,!p.is_published)}>{p.is_published? 'Unpublish':'Publish'}</Button></div></div>) : <div>No projects</div>}</div></div>;
}
