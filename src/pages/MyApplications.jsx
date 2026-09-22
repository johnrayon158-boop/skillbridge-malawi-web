import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { fetchOwnApplications, getCurrentUserId, readableSupabaseError } from '../lib/supabaseData';
import { supabase } from '../lib/supabaseClient';

export default function MyApplications(){
  const { token } = useAuth();
  const [apps,setApps]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(null);
  const fetchApps = async ()=>{ setLoading(true); try{ const userId = await getCurrentUserId(); if(!userId) return; const { data, error: queryError } = await fetchOwnApplications(userId); if(queryError) throw queryError; setApps(data || []); }catch(e){ setError(readableSupabaseError(e, 'Unable to load your applications.'));} finally { setLoading(false); } };
  useEffect(()=>{ if(token) fetchApps(); },[token]);
  const withdraw = async (id)=>{ if(!confirm('Withdraw application?')) return; const userId = await getCurrentUserId(); const { error: updateError } = await supabase.from('applications').update({ status:'withdrawn' }).eq('id', id).eq('applicant_id', userId); if(updateError) setError(readableSupabaseError(updateError, 'Unable to withdraw application.')); else fetchApps(); };
  if(!token) return <div className="panel"><h3>Please log in</h3></div>;
  if(loading) return <div className="panel">Loading…</div>;
  return <div><PageHeader eyebrow="Applications" title="My applications" description="Track your applications and view timelines."/><div className="panel">{error&&<div className="error">{error}</div>}{apps.length?apps.map(a=><div className="app-row" key={a.id}><div><b>{a.jobs?.title || 'Job application'}</b><small>{a.jobs?.employer_profiles?.company_name || ''}</small><div className="meta">Applied {new Date(a.applied_at).toLocaleString()}</div></div><div><div className="status">{a.status}</div><div className="timeline">{a.application_events?.map(e=><div key={e.id}><small>{new Date(e.created_at).toLocaleString()}</small><div>{e.status}{e.note?': '+e.note:''}</div></div>)}</div><div className="actions"><Button variant="outline" onClick={()=>window.location.hash='job-'+a.job_id}>View job</Button>{!['accepted','rejected','withdrawn'].includes(a.status)&&<Button variant="danger" onClick={()=>withdraw(a.id)}>Withdraw</Button>}</div></div></div>):<div className="empty">You have not applied to any jobs yet.</div>}</div></div>;
}
