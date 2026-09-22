import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { fetchJob, readableSupabaseError } from '../lib/supabaseData';
import { supabase } from '../lib/supabaseClient';

export default function JobDetailPublic({ id }){
  const [job,setJob]=useState(null); const [loading,setLoading]=useState(true); const [error,setError]=useState(null);
  const [applying,setApplying]=useState(false); const [cover,setCover]=useState(''); const [projects,setProjects]=useState([]); const [certs,setCerts]=useState([]); const [selectedProject,setSelectedProject]=useState(''); const [selectedCert,setSelectedCert]=useState('');
  useEffect(()=>{ if(!id) return; (async ()=>{ setLoading(true); const { data, error: queryError }=await fetchJob(id); if(queryError) setError(readableSupabaseError(queryError,'Unable to load this job.')); else setJob(data); setLoading(false); })(); },[id]);
  useEffect(()=>{ (async ()=>{ const { data:{user} }=await supabase.auth.getUser(); if(!user) return; const [{ data: portfolio }, { data: certificates }]=await Promise.all([supabase.from('portfolios').select('id,portfolio_projects(id,title)').eq('user_id',user.id).maybeSingle(),supabase.from('portfolios').select('portfolio_certificates(id,title)').eq('user_id',user.id).maybeSingle()]); setProjects(portfolio?.portfolio_projects||[]); setCerts(certificates?.portfolio_certificates||[]); })(); },[]);
  if(!id) return <div className="panel">Select a job</div>;
  if(loading) return <div className="panel">Loading…</div>;
  if(error) return <div className="panel"><div className="error">{error}</div></div>;
  if(!job) return <div className="panel"><div className="empty">Job not found.</div></div>;
  const submitApplication = async ()=>{
    try{ setApplying(true); const { data:{user} }=await supabase.auth.getUser(); if(!user){ window.location.hash='login'; return; } const { error: insertError }=await supabase.from('applications').insert({ applicant_id:user.id, job_id:id, cover_letter:cover||null }); if(insertError) throw insertError; window.location.hash='applications'; }catch(e){ alert(readableSupabaseError(e,'Unable to submit your application.')); } finally{ setApplying(false); } };

  return <div><PageHeader eyebrow="Job" title={job.title} description={job.employer_profiles?.company_name} /><div className="panel"><h3>About this job</h3><p>{job.description}</p><div className="meta">{job.location_text} · {job.employment_type}</div><div className="job-skills"><h4>Required skills</h4><div className="tags">{job.job_skills?.map(({skills:s})=><span key={s.id}>{s.name}</span>)}</div></div><div className="apply-panel"><h4>Apply for this role</h4><label>Cover letter<textarea value={cover} onChange={e=>setCover(e.target.value)} /></label><div className="form-actions"><Button onClick={submitApplication} disabled={applying}>{applying? 'Applying…':'Apply now'}</Button><Button variant="outline" onClick={async()=>{const {data:{user}}=await supabase.auth.getUser();if(user){await supabase.from('saved_jobs').upsert({user_id:user.id,job_id:id});}}}>Save job</Button></div></div></div></div>;
}
