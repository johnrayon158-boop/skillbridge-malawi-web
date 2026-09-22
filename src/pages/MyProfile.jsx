import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabaseClient';
import Button from '../components/Button';
import Badge from '../components/Badge';
import PageHeader from '../components/PageHeader';

function SectionHead({title,action}){return <div className="section-head"><h3>{title}</h3>{action&&<div>{action}</div>}</div>}

export default function MyProfile(){
  const { token, user, profile: authProfile } = useAuth();
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [profile,setProfile]=useState(null);
  const [editing,setEditing]=useState(false);
  const [personal,setPersonal]=useState({full_name:'',bio:'',location:'',phone:'',photo_url:''});

  const fetchProfile = async ()=>{
    if(!authProfile) return;
    setLoading(false); setError(null);
    setProfile({ profile: authProfile, user, education: [], skills: [], experiences: [], certificates: [] });
    setPersonal({ full_name: authProfile.full_name||'', bio: authProfile.bio||'', location: authProfile.location||'', phone: authProfile.phone||'', photo_url: authProfile.profile_photo_url||'' });
  };

  useEffect(()=>{ if(token) fetchProfile(); },[token, authProfile, user]);

  const savePersonal = async ()=>{
    setError(null);
    try{
      const { error: updateError } = await supabase.from('profiles').update({ full_name:personal.full_name, bio:personal.bio, location:personal.location, phone:personal.phone, profile_photo_url:personal.photo_url }).eq('user_id', user.id);
      if(updateError) throw new Error('Unable to save your profile. Please try again.');
      const updatedProfile = { ...authProfile, full_name:personal.full_name, bio:personal.bio, location:personal.location, phone:personal.phone, profile_photo_url:personal.photo_url };
      setProfile(current => ({ ...current, profile: updatedProfile }));
      setEditing(false);
    }catch(err){ setError(err.message); }
  };

  const addEducation = async (e)=>{
    e.preventDefault(); const form = e.target; const fd = { institution: form.institution.value, program: form.program.value, degree: form.degree.value, start_date: form.start_date.value || null, end_date: form.end_date.value || null, notes: form.notes.value || null };
    try{ setError(null); const res = await fetch('/api/profile/education', { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify(fd) }); const data = await res.json(); if(!res.ok) throw new Error(data.error||'Add failed'); fetchProfile(); form.reset(); }catch(err){ setError(err.message); }
  };

  const removeEducation = async (id)=>{ if(!confirm('Delete education record?')) return; try{ await fetch('/api/profile/education/'+id, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } }); fetchProfile(); }catch(err){ setError(err.message); } };

  const addSkill = async (e)=>{ e.preventDefault(); const form=e.target; const fd = { skillName: form.skill.value, categoryName: form.category.value, proficiency: parseInt(form.proficiency.value||0,10) || null, years_experience: parseInt(form.years.value||0,10)||null, evidence_url: form.evidence.value||null }; if(!fd.skillName){ setError('Skill name required'); return; } try{ setError(null); const res = await fetch('/api/profile/skills', { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify(fd) }); const data=await res.json(); if(!res.ok) throw new Error(data.error||'Add failed'); fetchProfile(); form.reset(); }catch(err){ setError(err.message); } };

  const removeSkill = async (id)=>{ if(!confirm('Remove skill?')) return; try{ await fetch('/api/profile/skills/'+id, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } }); fetchProfile(); }catch(err){ setError(err.message); } };

  const addExperience = async (e)=>{ e.preventDefault(); const form=e.target; const fd={ title: form.title.value, organization: form.organization.value, description: form.description.value, start_date: form.start_date.value||null, end_date: form.end_date.value||null }; if(!fd.title){ setError('Title required'); return; } try{ setError(null); const res=await fetch('/api/profile/experiences',{ method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify(fd) }); const data=await res.json(); if(!res.ok) throw new Error(data.error||'Add failed'); fetchProfile(); form.reset(); }catch(err){ setError(err.message); } };

  const removeExperience = async (id)=>{ if(!confirm('Remove experience?')) return; try{ await fetch('/api/profile/experiences/'+id,{ method:'DELETE', headers:{ Authorization:`Bearer ${token}` } }); fetchProfile(); }catch(err){ setError(err.message); } };

  const addCertificate = async (e)=>{ e.preventDefault(); const form=e.target; const fd={ title: form.title.value, issuer: form.issuer.value, url: form.url.value || null, issued_date: form.issued_date.value || null }; if(!fd.title){ setError('Title required'); return; } try{ setError(null); const res = await fetch('/api/profile/certificates',{ method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify(fd) }); const data=await res.json(); if(!res.ok) throw new Error(data.error||'Add failed'); fetchProfile(); form.reset(); }catch(err){ setError(err.message); } };

  const removeCertificate = async (id)=>{ if(!confirm('Remove certificate?')) return; try{ await fetch('/api/profile/certificates/'+id,{ method:'DELETE', headers:{ Authorization:`Bearer ${token}` } }); fetchProfile(); }catch(err){ setError(err.message); } };

  if(!token) return <div className="panel"><h3>Please log in to manage your profile</h3></div>;
  if(loading) return <div className="panel"><h3>Loading profile…</h3></div>;
  if(error) return <div className="panel"><h3>Error</h3><p className="error">{error}</p></div>;

  const p = profile.profile || {};
  const completion = p.completion_percent || 0;

  return <div>
    <PageHeader eyebrow="My profile" title="Your profile" description="Manage personal info, education, skills, experience and certificates."/>
    <div className="profile-overview panel">
      <div className="overview-left"><div className="avatar xl">{(p.full_name||'').split(' ').map(n=>n[0]).slice(0,2).join('')}</div></div>
      <div className="overview-main"><h2>{p.full_name||profile.user?.email}</h2><p>{p.bio}</p><div className="meta"><span>{p.location}</span><span>{p.phone}</span></div></div>
      <div className="overview-side"><Badge tone="success">{completion}% complete</Badge><Button variant="outline" onClick={()=>setEditing(!editing)}>{editing?'Cancel':'Edit profile'}</Button></div>
    </div>

    {editing&&<div className="panel"><h3>Edit personal information</h3><div className="form-grid"><label>Full name<input value={personal.full_name} onChange={e=>setPersonal({...personal,full_name:e.target.value})}/></label><label>Phone<input value={personal.phone} onChange={e=>setPersonal({...personal,phone:e.target.value})}/></label><label>Location<input value={personal.location} onChange={e=>setPersonal({...personal,location:e.target.value})}/></label><label>Profile photo URL<input value={personal.photo_url} onChange={e=>setPersonal({...personal,photo_url:e.target.value})}/></label><label>Bio<textarea value={personal.bio} onChange={e=>setPersonal({...personal,bio:e.target.value})}/></label><div className="form-actions"><Button onClick={savePersonal}>Save</Button></div></div></div>}

    <div className="panel"><SectionHead title="Education" action={<small>Add education below</small>} />
      <div className="education-list">{(profile.education.length?profile.education.map(ed=><div className="edu-row" key={ed.id}><div><b>{ed.degree||ed.program_name||'Study'}</b><small>{ed.institution_name||'—'}</small><div className="dates">{ed.start_date||'—'} — {ed.end_date||'Present'}</div></div><div><button onClick={()=>removeEducation(ed.id)}>Delete</button></div></div>):<div className="empty">No education records yet</div>)}</div>
      <form className="form-grid" onSubmit={addEducation}><label>Institution<input name="institution" placeholder="e.g. DMI-St John"/></label><label>Program<input name="program" placeholder="e.g. BSc Computer Science"/></label><label>Qualification<input name="degree" placeholder="e.g. BSc"/></label><label>Start year<input name="start_date" type="date"/></label><label>End year<input name="end_date" type="date"/></label><label>Notes<textarea name="notes"/></label><div className="form-actions"><Button type="submit">Add education</Button></div></form>
    </div>

    <div className="panel"><SectionHead title="Skills" action={<small>Add a skill</small>} />
      <div className="skills-list">{(profile.skills.length?profile.skills.map(s=><div className="skill-row" key={s.id}><div><b>{s.skill_name}</b><small>{s.proficiency?`Level ${s.proficiency}`:'—'}</small><div>{s.years_experience?`${s.years_experience} yrs`:'—'}</div></div><div><button onClick={()=>removeSkill(s.id)}>Remove</button></div></div>):<div className="empty">No skills yet</div>)}</div>
      <form className="form-grid" onSubmit={addSkill}><label>Skill<input name="skill" placeholder="e.g. JavaScript"/></label><label>Category<input name="category" placeholder="e.g. Programming"/></label><label>Proficiency<select name="proficiency"><option value="">Select</option><option value="1">1 - Beginner</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5 - Expert</option></select></label><label>Years experience<input name="years" type="number" min="0"/></label><label>Evidence URL<input name="evidence" placeholder="Link to sample or certificate"/></label><div className="form-actions"><Button type="submit">Add skill</Button></div></form>
    </div>

    <div className="panel"><SectionHead title="Experience" action={<small>Add work experience</small>} />
      <div className="exp-list">{(profile.experiences.length?profile.experiences.map(x=><div className="exp-row" key={x.id}><div><b>{x.title}</b><small>{x.organization}</small><div className="dates">{x.start_date||'—'} — {x.end_date||'Present'}</div><p>{x.description}</p></div><div><button onClick={()=>removeExperience(x.id)}>Delete</button></div></div>):<div className="empty">No work experience yet</div>)}</div>
      <form className="form-grid" onSubmit={addExperience}><label>Job title<input name="title" required/></label><label>Organization<input name="organization"/></label><label>Start date<input name="start_date" type="date"/></label><label>End date<input name="end_date" type="date"/></label><label>Description<textarea name="description"/></label><div className="form-actions"><Button type="submit">Add experience</Button></div></form>
    </div>

    <div className="panel"><SectionHead title="Certificates" action={<small>Add certificate</small>} />
      <div className="cert-list">{(profile.certificates.length?profile.certificates.map(c=><div className="cert-row" key={c.id}><div><b>{c.title}</b><small>{c.issuer}</small><div className="dates">{c.issued_date||'—'}</div></div><div><button onClick={()=>removeCertificate(c.id)}>Delete</button></div></div>):<div className="empty">No certificates yet</div>)}</div>
      <form className="form-grid" onSubmit={addCertificate}><label>Certificate name<input name="title" required/></label><label>Issuing organization<input name="issuer"/></label><label>Issue date<input name="issued_date" type="date"/></label><label>Credential URL<input name="url"/></label><div className="form-actions"><Button type="submit">Add certificate</Button></div></form>
    </div>

  </div>;
}
