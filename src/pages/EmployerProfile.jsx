import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';

export default function EmployerProfile(){
  const { token } = useAuth();
  const [loading,setLoading]=useState(true); const [error,setError]=useState(null); const [data,setData]=useState({companyName:'',website:'',location:'',description:'',email:'',phone:'',size:''});
  const fetchProfile=async()=>{ setLoading(true); try{ const r=await fetch('/api/employer/me',{ headers:{ Authorization:`Bearer ${token}` } }); const d=await r.json(); if(!r.ok) throw new Error(d.error||'Failed'); setData({ companyName: d.company_name||'', website: d.company_website||'', location: d.company_location||'', description: d.company_description||'', email: d.company_email||'', phone: d.company_phone||'', size: d.company_size||'' }); }catch(e){ setError(e.message); } setLoading(false); };
  useEffect(()=>{ if(token) fetchProfile(); },[token]);
  const save=async()=>{ try{ const r=await fetch('/api/employer/me',{ method:'PUT', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ companyName: data.companyName, website: data.website, location: data.location, description: data.description, email: data.email, phone: data.phone, size: data.size }) }); const j=await r.json(); if(!r.ok) throw new Error(j.error||'Save failed'); fetchProfile(); }catch(e){ setError(e.message); } };
  if(!token) return <div className="panel"><h3>Please log in</h3></div>;
  if(loading) return <div className="panel">Loading…</div>;
  return <div><PageHeader eyebrow="Employer" title="Company profile" description="Manage your company details."/><div className="panel form-grid"><label>Company name<input value={data.companyName} onChange={e=>setData({...data,companyName:e.target.value})}/></label><label>Website<input value={data.website} onChange={e=>setData({...data,website:e.target.value})}/></label><label>Location<input value={data.location} onChange={e=>setData({...data,location:e.target.value})}/></label><label>Email<input value={data.email} onChange={e=>setData({...data,email:e.target.value})}/></label><label>Phone<input value={data.phone} onChange={e=>setData({...data,phone:e.target.value})}/></label><label>Company size<input value={data.size} onChange={e=>setData({...data,size:e.target.value})}/></label><label>Description<textarea value={data.description} onChange={e=>setData({...data,description:e.target.value})}/></label><div className="form-actions"><Button onClick={save}>Save company profile</Button></div>{error&&<div className="error">{error}</div>}</div></div>;
}
