import React from 'react';
import { useAuth } from '../auth/AuthProvider';
import Logo from './Logo';
import Icon from './Icon';
import Button from './Button';
import NotificationDropdown from './NotificationDropdown';

export default function AppShell({role,page,go,switchRole,theme,setTheme,children}){
 const studentItems=[['dashboard','Dashboard','⌂'],['profile','My Profile','◉'],['careers_dir','Career Guidance','✦'],['assessments','Skills Assessment','✓'],['skill-gap','Skills Gap Analysis','◒'],['learning-resources','Learning Resources','▤'],['my-portfolio','My Portfolio','▣'],['jobs','Jobs & Internships','⌕'],['applications','My Applications','□'],['notifications','Notifications','●'],['settings','Settings','⚙']];
 const employerItems=[['employer','Overview','⌂'],['employer_profile','Company Profile','◉'],['post-job','Post a Job','＋'],['manage-jobs','Manage Jobs','▤'],['candidates','Recommended Candidates','♢'],['employer-apps','Applications','□'],['notifications','Notifications','●'],['settings','Settings','⚙']];
 const items=role==='employer'?employerItems:studentItems;
	const { logout } = useAuth();
	return <div className="shell"><aside className="sidebar"><Logo small/><div className="user-mini"><div className="avatar">BC</div><div><b>{role==='employer'?'Tech Solutions Ltd':'Blessings Chirwa'}</b><span>{role==='employer'?'Employer':'Student'}</span></div></div><div className="side-nav">{items.map(([id,label,ico])=><button className={page===id?'selected':''} key={id} onClick={()=>go(id)}><Icon>{ico}</Icon>{label}</button>)}</div><button className="logout" onClick={async()=>{await logout(); go('home');}}>↪ Log out</button></aside><section className="workspace"><div className="topbar"><div className="search"><span>⌕</span><input placeholder="Search careers, jobs, skills..." onKeyDown={e=>{if(e.key==='Enter'&&e.currentTarget.value.trim()){go('jobs');}}}/></div><div className="top-actions"><button onClick={()=>go('jobs')} aria-label="Saved jobs">♡</button><button onClick={()=>go('notifications')} aria-label="Messages">♧</button><NotificationDropdown/><button className="theme" onClick={()=>setTheme(theme==='light'?'dark':'light')}>{theme==='light'?'☼':'◐'}</button><button className="switch" onClick={()=>switchRole(role==='student'?'employer':'student')}>⇄ Switch role</button><button className="avatar sm" onClick={()=>go('profile')} aria-label="Open profile">BC</button></div></div><main>{children}</main></section></div>
}
