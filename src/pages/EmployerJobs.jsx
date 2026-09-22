import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { supabase } from '../lib/supabaseClient';
import { readableSupabaseError } from '../lib/supabaseData';

export default function EmployerJobs(){
  const { token } = useAuth();
  const [jobs,setJobs]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(null);
  const fetchJobs = async ()=>{ setLoading(true); try{ const { data:userData }=await supabase.auth.getUser(); const { data:employer, error:employerError }=await supabase.from('employer_profiles').select('id').eq('user_id',userData.user.id).maybeSingle(); if(employerError) throw employerError; if(!employer){ setJobs([]); return; } const { data, error:queryError }=await supabase.from('jobs').select('id,title,description,employment_type,location_text,status,application_deadline,employer_profiles(company_name)').eq('employer_id',employer.id).order('created_at',{ascending:false}); if(queryError) throw queryError; setJobs(data||[]); }catch(e){ setError(readableSupabaseError(e,'Unable to load your jobs.'));} finally { setLoading(false); } };
  useEffect(()=>{ if(token) fetchJobs(); },[token]);
  const remove = async (id)=>{ if(!confirm('Delete job?')) return; const { error:deleteError }=await supabase.from('jobs').delete().eq('id',id); if(deleteError) setError(readableSupabaseError(deleteError,'Unable to delete job.')); else fetchJobs(); };
  const publish = async (id)=>{ const { error:updateError }=await supabase.from('jobs').update({status:'published',published_at:new Date().toISOString()}).eq('id',id); if(updateError) setError(readableSupabaseError(updateError,'Unable to publish job.')); else fetchJobs(); };
  const closeJob = async (id)=>{ const { error:updateError }=await supabase.from('jobs').update({status:'closed'}).eq('id',id); if(updateError) setError(readableSupabaseError(updateError,'Unable to close job.')); else fetchJobs(); };
  if(!token) return <div className="panel"><h3>Please log in</h3></div>;
  if(loading) return <div className="panel">Loading…</div>;
  return <div><PageHeader eyebrow="Jobs" title="Manage jobs" description="Create, edit and publish job postings." action={<Button onClick={()=>window.location.hash='post-job'}>＋ New job</Button>} /><div className="panel">{error&&<div className="error">{error}</div>}{jobs.length?jobs.map(j=><div className="job-row" key={j.id}><div><b>{j.title}</b><small>{j.employer_profiles?.company_name}</small><div>{j.location_text} · {j.employment_type}</div></div><div className="job-actions"><Button variant="outline" onClick={()=>window.location.hash='post-job-'+j.id}>Edit</Button>{j.status!=='published'?<Button onClick={()=>publish(j.id)}>Publish</Button>:<Button onClick={()=>closeJob(j.id)}>Close</Button>}<Button variant="danger" onClick={()=>remove(j.id)}>Delete</Button></div></div>):<div className="empty">No jobs yet</div>}</div></div>;
}
