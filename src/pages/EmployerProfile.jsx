import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { supabase } from '../lib/supabaseClient';
import { readableSupabaseError } from '../lib/supabaseData';

export default function EmployerProfile(){
  const { token } = useAuth();
  const [loading,setLoading]=useState(true); const [error,setError]=useState(null); const [data,setData]=useState({companyName:'',website:'',location:'',description:'',email:'',phone:'',size:''});
  const fetchProfile=async()=>{ setLoading(true); try{ const { data:d, error:queryError }=await supabase.from('employer_profiles').select('*').eq('user_id',(await supabase.auth.getUser()).data.user.id).maybeSingle(); if(queryError) throw queryError; setData({ companyName:d?.company_name||'', website:d?.website||'', location:d?.location_text||'', description:d?.description||'', email:d?.contact_information?.email||'', phone:d?.contact_information?.phone||'', size:d?.company_size||'' }); }catch(e){ setError(readableSupabaseError(e,'Unable to load company profile.')); } setLoading(false); };
  useEffect(()=>{ if(token) fetchProfile(); },[token]);
  const save=async()=>{ try{ const { data:userData }=await supabase.auth.getUser(); const payload={user_id:userData.user.id,company_name:data.companyName,website:data.website,location_text:data.location,description:data.description,company_size:data.size,contact_information:{email:data.email,phone:data.phone}}; const { error:saveError }=await supabase.from('employer_profiles').upsert(payload,{onConflict:'user_id'}); if(saveError) throw saveError; fetchProfile(); }catch(e){ setError(readableSupabaseError(e,'Unable to save company profile.')); } };
  if(!token) return <div className="panel"><h3>Please log in</h3></div>;
  if(loading) return <div className="panel">Loading…</div>;
  return <div><PageHeader eyebrow="Employer" title="Company profile" description="Manage your company details."/><div className="panel form-grid"><label>Company name<input value={data.companyName} onChange={e=>setData({...data,companyName:e.target.value})}/></label><label>Website<input value={data.website} onChange={e=>setData({...data,website:e.target.value})}/></label><label>Location<input value={data.location} onChange={e=>setData({...data,location:e.target.value})}/></label><label>Email<input value={data.email} onChange={e=>setData({...data,email:e.target.value})}/></label><label>Phone<input value={data.phone} onChange={e=>setData({...data,phone:e.target.value})}/></label><label>Company size<input value={data.size} onChange={e=>setData({...data,size:e.target.value})}/></label><label>Description<textarea value={data.description} onChange={e=>setData({...data,description:e.target.value})}/></label><div className="form-actions"><Button onClick={save}>Save company profile</Button></div>{error&&<div className="error">{error}</div>}</div></div>;
}
