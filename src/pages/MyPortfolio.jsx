import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabaseClient';
import { readableSupabaseError } from '../lib/supabaseData';

export default function MyPortfolio(){
  const { user, profile:authProfile } = useAuth();
  const [list,setList]=useState([]);
  const [portfolio,setPortfolio]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const fetchList = async ()=>{ if(!user) return; setLoading(true); const { data:portfolioData,error:portfolioError }=await supabase.from('portfolios').select('id,title,bio,is_public,portfolio_projects(*)').eq('user_id',user.id).maybeSingle(); if(portfolioError) setError(readableSupabaseError(portfolioError,'Unable to load portfolio.')); else {setPortfolio(portfolioData);setList(portfolioData?.portfolio_projects||[]);} setLoading(false); };
  useEffect(()=>{ fetchList(); },[user]);
  const del = async (id)=>{ if(!confirm('Delete project?')) return; const {error:deleteError}=await supabase.from('portfolio_projects').delete().eq('id',id); if(deleteError) setError(readableSupabaseError(deleteError,'Unable to delete project.')); else fetchList(); };
  const publish = async (id,isPublished)=>{ const {error:updateError}=await supabase.from('portfolio_projects').update({is_published:isPublished}).eq('id',id); if(updateError) setError(readableSupabaseError(updateError,'Unable to update project.')); else fetchList(); };
  if(!user) return <div className="panel"><h3>Please log in to manage your portfolio</h3></div>;
  if(loading) return <div className="panel"><h3>Loading portfolio…</h3></div>;
  const initials=(authProfile?.full_name||user.email||'U').split(' ').map(part=>part[0]).slice(0,2).join('').toUpperCase();
  return <div><PageHeader eyebrow="Portfolio" title="My portfolio" description="Showcase your projects, skills and professional evidence." action={<Button onClick={()=>window.location.hash='project-new'}>＋ Add project</Button>}/>{error&&<div className="panel error">{error}</div>}<div className="portfolio-head panel"><div className="avatar xl">{initials}</div><div><h2>{authProfile?.full_name||user.email}</h2><p>{authProfile?.programme||'Professional portfolio'} · {authProfile?.location||'Malawi'}</p><div className="chips"><span>{authProfile?.role||'Member'}</span>{authProfile?.career_interests?.slice(0,3).map(interest=><span key={interest}>{interest}</span>)}</div></div><Badge tone={portfolio?.is_public?'success':'soft'}>{portfolio?.is_public?'Public portfolio':'Private portfolio'}</Badge></div>{list.length?<div className="project-grid">{list.map(project=><article key={project.id} className="project-card"><div className="project-cover"><span>▦</span></div><div><Badge tone="soft">{project.is_published?'Published':'Draft'}</Badge><h3>{project.title}</h3><p>{project.description||'No project description yet.'}</p><small>{(project.technologies||[]).join(' · ')||'Add technologies to describe this project.'}</small><button onClick={()=>window.location.hash='project-'+project.id}>Edit project →</button><div className="project-actions"><Button variant="outline" onClick={()=>publish(project.id,!project.is_published)}>{project.is_published?'Unpublish':'Publish'}</Button><Button variant="danger" onClick={()=>del(project.id)}>Delete</Button></div></div></article>)}</div>:<div className="panel empty">No projects yet. Add your first project to build your portfolio.</div>}</div>;
}
