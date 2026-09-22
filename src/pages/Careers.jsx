import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';

export default function Careers(){
  const [careers,setCareers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [q,setQ]=useState('');

  const fetchCareers = async ()=>{
    setLoading(true); setError(null);
    try{ const res = await fetch('/api/careers?q='+encodeURIComponent(q)); const data=await res.json(); if(!res.ok) throw new Error(data.error||'Failed'); setCareers(data); }catch(err){ setError(err.message); } setLoading(false);
  };
  useEffect(()=>{ fetchCareers(); },[q]);

  return <div>
    <PageHeader eyebrow="Careers" title="Career directory" description="Explore career profiles and required skills." action={<Button onClick={()=>{}}>＋ Add career</Button>} />
    <div className="panel"><input placeholder="Search careers" value={q} onChange={e=>setQ(e.target.value)}/></div>
    <div className="panel">{loading? <p>Loading…</p> : error ? <p className="error">{error}</p> : careers.length ? <div className="list-grid">{careers.map(c=><div key={c.id} className="list-item"><h4>{c.title}</h4><p className="muted">{c.category_name||'General'}</p><a href={'#career-'+c.id}>View →</a></div>)}</div> : <div className="empty">No careers found</div>}</div>
  </div>;
}
