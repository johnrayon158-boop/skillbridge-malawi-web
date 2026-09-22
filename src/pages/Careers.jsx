import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { fetchCareers, readableSupabaseError } from '../lib/supabaseData';

export default function Careers(){
  const [careers,setCareers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [q,setQ]=useState('');

  const fetchCareers = async ()=>{
    setLoading(true); setError(null);
    try{ const { data, error } = await fetchCareers(q); if(error) throw error; setCareers(data || []); }catch(err){ setError(readableSupabaseError(err, 'Unable to load careers.')); } setLoading(false);
  };
  useEffect(()=>{ fetchCareers(); },[q]);

  return <div>
    <PageHeader eyebrow="Careers" title="Career directory" description="Explore career profiles and required skills." />
    <div className="panel"><input placeholder="Search careers" value={q} onChange={e=>setQ(e.target.value)}/></div>
    <div className="panel">{loading? <p>Loading careers…</p> : error ? <p className="error">{error}</p> : careers.length ? <div className="list-grid">{careers.map(c=><div key={c.id} className="list-item"><h4>{c.title}</h4><p className="muted">{c.career_categories?.name || c.industry || 'General'}</p><a href={'#career-'+c.id}>View →</a></div>)}</div> : <div className="empty">No careers found</div>}</div>
  </div>;
}
