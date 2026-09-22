import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabaseClient';
import Button from '../components/Button';
import Badge from '../components/Badge';
import PageHeader from '../components/PageHeader';
import { readableSupabaseError } from '../lib/supabaseData';
import '../profile.css';

function SectionHead({title,action}){return <div className="section-head"><h3>{title}</h3>{action&&<div>{action}</div>}</div>}

export default function MyProfile(){
  const { token, user, profile: authProfile } = useAuth();
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [profile,setProfile]=useState(null);
  const [editing,setEditing]=useState(false);
  const [personal,setPersonal]=useState({full_name:'',bio:'',location:'',phone:'',photo_url:''});

  const fetchProfile = async ()=>{
    if(!token || !user) return;
    setLoading(true); setError(null);
    try{
      if(!authProfile){
        setError('Your profile record could not be loaded. Please refresh or contact support.');
        return;
      }
      const results = await Promise.all([
        supabase.from('education_history').select('*').eq('user_id', user.id).order('start_date', { ascending: false }),
        supabase.from('user_skills').select('id,skill_id,proficiency_level,proficiency_score,years_experience,evidence,skills(name)').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('work_experience').select('*').eq('user_id', user.id).order('start_date', { ascending: false }),
        supabase.from('portfolios').select('id,portfolio_certificates(*)').eq('user_id', user.id).maybeSingle()
      ]);
      const failed = results.find(result=>result.error);
      if(failed?.error) throw failed.error;
      const [educationResult, skillsResult, experiencesResult, portfolioResult] = results;
      setProfile({ profile: authProfile, user, education: educationResult.data || [], skills: skillsResult.data || [], experiences: experiencesResult.data || [], certificates: portfolioResult.data?.portfolio_certificates || [] });
      setPersonal({ full_name: authProfile.full_name||'', bio: authProfile.bio||'', location: authProfile.location||'', phone: authProfile.phone||'', photo_url: authProfile.profile_photo_url||'' });
    }catch(fetchError){
      setError(readableSupabaseError(fetchError, 'Unable to load your profile. Check your Supabase permissions and try again.'));
    }finally{
      setLoading(false);
    }
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
    e.preventDefault(); const form = e.target; const fd = { user_id:user.id, institution_name: form.institution.value, programme_name:form.program.value, start_date: form.start_date.value || null, end_date: form.end_date.value || null };
    try{ setError(null); const { error:insertError }=await supabase.from('education_history').insert(fd); if(insertError) throw insertError; await fetchProfile(); form.reset(); }catch(err){ setError('Unable to add education record.'); }
  };

  const removeEducation = async (id)=>{ if(!confirm('Delete education record?')) return; const { error:deleteError }=await supabase.from('education_history').delete().eq('id',id).eq('user_id',user.id); if(deleteError) setError('Unable to remove education record.'); else fetchProfile(); };

  const addSkill = async (e)=>{ e.preventDefault(); const form=e.target; const skillName=form.skill.value.trim(); if(!skillName){ setError('Skill name required'); return; } try{ setError(null); let { data:skill }=await supabase.from('skills').select('id').eq('name',skillName).maybeSingle(); if(!skill){ setError('Choose a skill from the seeded skill catalogue.'); return; } const { error:insertError }=await supabase.from('user_skills').upsert({user_id:user.id,skill_id:skill.id,proficiency_level:form.proficiency.value||null,years_experience:parseInt(form.years.value||0,10)||null,evidence:form.evidence.value||null},{onConflict:'user_id,skill_id'}); if(insertError) throw insertError; fetchProfile(); form.reset(); }catch(err){ setError('Unable to save skill.'); } };

  const removeSkill = async (id)=>{ if(!confirm('Remove skill?')) return; const { error:deleteError }=await supabase.from('user_skills').delete().eq('id',id).eq('user_id',user.id); if(deleteError) setError('Unable to remove skill.'); else fetchProfile(); };

  const addExperience = async (e)=>{ e.preventDefault(); const form=e.target; const fd={ user_id:user.id,title: form.title.value, organization: form.organization.value, description: form.description.value, start_date: form.start_date.value||null, end_date: form.end_date.value||null }; if(!fd.title){ setError('Title required'); return; } try{ setError(null); const { error:insertError }=await supabase.from('work_experience').insert(fd); if(insertError) throw insertError; fetchProfile(); form.reset(); }catch(err){ setError('Unable to add experience.'); } };

  const removeExperience = async (id)=>{ if(!confirm('Remove experience?')) return; const { error:deleteError }=await supabase.from('work_experience').delete().eq('id',id).eq('user_id',user.id); if(deleteError) setError('Unable to remove experience.'); else fetchProfile(); };

  const addCertificate = async (e)=>{ e.preventDefault(); const form=e.target; if(!form.title.value){ setError('Title required'); return; } try{ setError(null); let { data:portfolio }=await supabase.from('portfolios').select('id').eq('user_id',user.id).maybeSingle(); if(!portfolio){ const result=await supabase.from('portfolios').insert({user_id:user.id,title:`${authProfile.full_name || 'My'} Portfolio`}).select('id').single(); if(result.error) throw result.error; portfolio=result.data; } const { error:insertError }=await supabase.from('portfolio_certificates').insert({portfolio_id:portfolio.id,title:form.title.value,issuer:form.issuer.value,credential_url:form.url.value||null,issued_date:form.issued_date.value||null}); if(insertError) throw insertError; fetchProfile(); form.reset(); }catch(err){ setError('Unable to add certificate.'); } };

  const removeCertificate = async (id)=>{ if(!confirm('Remove certificate?')) return; const { error:deleteError }=await supabase.from('portfolio_certificates').delete().eq('id',id); if(deleteError) setError('Unable to remove certificate.'); else fetchProfile(); };

  if(!token) return <div className="panel"><h3>Please log in to manage your profile</h3></div>;
  if(loading || !profile) return <div className="panel"><h3>Loading profile…</h3></div>;
  if(error) return <div className="panel"><h3>Error</h3><p className="error">{error}</p></div>;

  const p = profile.profile || {};
  const completion = p.profile_completion || 0;

  return <div>
    <PageHeader eyebrow="My profile" title="Your profile" description="Manage personal info, education, skills, experience and certificates."/>
    <div className="profile-overview panel">
      <div className="overview-left"><div className="avatar xl">{p.profile_photo_url?<img src={p.profile_photo_url} alt="Profile"/>:(p.full_name||profile.user?.email||'U').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()}</div></div>
      <div className="overview-main"><h2>{p.full_name||profile.user?.email}</h2><p>{p.bio}</p><div className="meta"><span>{p.location}</span><span>{p.phone}</span></div></div>
      <div className="overview-side"><Badge tone="success">{completion}% complete</Badge><Button variant="outline" onClick={()=>setEditing(!editing)}>{editing?'Cancel':'Edit profile'}</Button></div>
    </div>

    {editing&&<div className="panel"><h3>Edit personal information</h3><div className="form-grid"><label>Full name<input value={personal.full_name} onChange={e=>setPersonal({...personal,full_name:e.target.value})}/></label><label>Phone<input value={personal.phone} onChange={e=>setPersonal({...personal,phone:e.target.value})}/></label><label>Location<input value={personal.location} onChange={e=>setPersonal({...personal,location:e.target.value})}/></label><label>Profile photo URL<input value={personal.photo_url} onChange={e=>setPersonal({...personal,photo_url:e.target.value})}/></label><label>Bio<textarea value={personal.bio} onChange={e=>setPersonal({...personal,bio:e.target.value})}/></label><div className="form-actions"><Button onClick={savePersonal}>Save</Button></div></div></div>}

    <div className="panel"><SectionHead title="Education" action={<small>Add education below</small>} />
      <div className="education-list">{(profile.education.length?profile.education.map(ed=><div className="edu-row" key={ed.id}><div><b>{ed.degree||ed.program_name||'Study'}</b><small>{ed.institution_name||'—'}</small><div className="dates">{ed.start_date||'—'} — {ed.end_date||'Present'}</div></div><div><button onClick={()=>removeEducation(ed.id)}>Delete</button></div></div>):<div className="empty">No education records yet</div>)}</div>
      <form className="form-grid" onSubmit={addEducation}><label>Institution<input name="institution" placeholder="e.g. DMI-St John"/></label><label>Program<input name="program" placeholder="e.g. BSc Computer Science"/></label><label>Qualification<input name="degree" placeholder="e.g. BSc"/></label><label>Start year<input name="start_date" type="date"/></label><label>End year<input name="end_date" type="date"/></label><label>Notes<textarea name="notes"/></label><div className="form-actions"><Button type="submit">Add education</Button></div></form>
    </div>

    <div className="panel"><SectionHead title="Skills" action={<small>Add a skill</small>} />
      <div className="skills-list">{(profile.skills.length?profile.skills.map(s=><div className="skill-row" key={s.id}><div><b>{s.skills?.name||'Skill'}</b><small>{s.proficiency_level?`Level ${s.proficiency_level}`:'—'}</small><div>{s.years_experience?`${s.years_experience} yrs`:'—'}</div></div><div><button onClick={()=>removeSkill(s.id)}>Remove</button></div></div>):<div className="empty">No skills yet</div>)}</div>
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
