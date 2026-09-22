import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';

export default function MyPortfolio(){
  const [list,setList]=useState([]);
  const fetchList = async ()=>{ const r=await fetch('/api/portfolio/me', { headers:{ Authorization:`Bearer ${localStorage.getItem('sb_token')}` } }); const d=await r.json(); if(r.ok) setList(d); };
  useEffect(()=>{ fetchList(); },[]);
  const del = async (id)=>{ if(!confirm('Delete project?')) return; const r=await fetch('/api/portfolio/'+id,{ method:'DELETE', headers:{ Authorization:`Bearer ${localStorage.getItem('sb_token')}` } }); const d=await r.json(); if(r.ok) fetchList(); else alert(d.error||'Failed'); };
  const publish = async (id,publish)=>{ const r=await fetch('/api/portfolio/'+id+'/publish',{ method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('sb_token')}` }, body: JSON.stringify({ publish }) }); const d=await r.json(); if(r.ok) fetchList(); else alert(d.error||'Failed'); };
  return <div><PageHeader eyebrow="Portfolio" title="My projects" description="Manage your professional portfolio." /><div className="panel"><div className="actions"><Button onClick={()=>window.location.hash='project-new'}>Add project</Button></div>{list.length? list.map(p=><div key={p.id} className="project"><h4>{p.title} {p.published? <small>· Published</small>:''}</h4><p>{p.description}</p><div><Button onClick={()=>window.location.hash='project-'+p.id}>Edit</Button><Button onClick={()=>del(p.id)}>Delete</Button><Button onClick={()=>publish(p.id,!p.published)}>{p.published? 'Unpublish':'Publish'}</Button></div></div>) : <div>No projects</div>}</div></div>;
}
