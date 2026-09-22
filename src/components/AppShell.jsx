import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import Logo from './Logo';
import Icon from './Icon';
import Button from './Button';
import NotificationDropdown from './NotificationDropdown';
import '../mobile.css';
import '../back-button.css';

export default function AppShell({role,page,go,switchRole,theme,setTheme,children}){
 const studentItems=[['dashboard','Dashboard','⌂'],['profile','My Profile','◉'],['careers_dir','Career Guidance','✦'],['assessments','Skills Assessment','✓'],['skill-gap','Skills Gap Analysis','◒'],['learning-resources','Learning Resources','▤'],['my-portfolio','My Portfolio','▣'],['jobs','Jobs & Internships','⌕'],['applications','My Applications','□'],['notifications','Notifications','●'],['settings','Settings','⚙']];
 const employerItems=[['employer','Overview','⌂'],['employer_profile','Company Profile','◉'],['post-job','Post a Job','＋'],['manage-jobs','Manage Jobs','▤'],['candidates','Recommended Candidates','♢'],['employer-apps','Applications','□'],['notifications','Notifications','●'],['settings','Settings','⚙']];
 const adminItems=[['admin','Dashboard','⌂'],['careers_dir','Careers','✦'],['skills','Skills','✓'],['assessments','Assessments','▤'],['learning-resources','Learning resources','▣'],['jobs','Jobs','⌕'],['notifications','Notifications','●'],['settings','Settings','⚙']];
 const items=role==='employer'?employerItems:role==='admin'?adminItems:studentItems;
 const displayName=role==='employer'?'Employer':role==='admin'?'Administrator':role==='graduate'?'Graduate':'Student';
	const { logout } = useAuth();
	const [menuOpen,setMenuOpen]=useState(false);
	const navigate=(target)=>{setMenuOpen(false);go(target);};
	const goBack=()=>{if(window.history.length>1) window.history.back(); else go(role==='employer'?'employer':role==='admin'?'admin':'dashboard');};
	return <div className="shell"><button className="mobile-menu" onClick={()=>setMenuOpen(!menuOpen)} aria-label="Toggle dashboard navigation">{menuOpen?'✕':'☰'}</button><aside className={'sidebar '+(menuOpen?'open':'')}><Logo small/><div className="user-mini"><div className="avatar">{displayName.slice(0,2).toUpperCase()}</div><div><b>{displayName}</b><span>{role}</span></div></div><div className="side-nav">{items.map(([id,label,ico])=><button className={page===id?'selected':''} key={id} onClick={()=>navigate(id)}><Icon>{ico}</Icon>{label}</button>)}</div><button className="logout" onClick={async()=>{setMenuOpen(false);await logout();go('login');}}>↪ Log out</button></aside><section className="workspace"><div className="topbar"><button className="back-button" onClick={goBack} aria-label="Go back">← Back</button><div className="search"><span>⌕</span><input placeholder="Search careers, jobs, skills..." onKeyDown={e=>{if(e.key==='Enter'&&e.currentTarget.value.trim()){navigate('jobs');}}}/></div><div className="top-actions"><button onClick={()=>navigate('jobs')} aria-label="Saved jobs">♡</button><button onClick={()=>navigate('notifications')} aria-label="Messages">♧</button><NotificationDropdown/><button className="theme" onClick={()=>setTheme(theme==='light'?'dark':'light')}>{theme==='light'?'☼':'◐'}</button>{role!=='admin'&&<button className="switch" onClick={switchRole}>⇄ Switch role</button>}<button className="logout top-logout" onClick={async()=>{await logout();go('login');}} aria-label="Log out">↪</button><button className="avatar sm" onClick={()=>navigate('profile')} aria-label="Open profile">{displayName.slice(0,2).toUpperCase()}</button></div></div><main>{children}</main></section></div>
}
