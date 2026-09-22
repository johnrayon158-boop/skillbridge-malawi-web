import React from 'react';
import Logo from './Logo';
import Button from './Button';
import Badge from './Badge';

export default function PublicNav({go,logged,role,switchRole,theme,setTheme}){
  return <header className="public-nav"><Logo/><nav><a className="active" onClick={()=>go('home')}>Home</a><a onClick={()=>go('careers')}>Careers</a><a onClick={()=>go('jobs')}>Jobs</a><a onClick={()=>go('how')}>How It Works</a><a onClick={()=>go('about')}>About</a></nav><div className="nav-actions">{logged&&<button className="role-btn" onClick={()=>switchRole(role==='student'?'employer':'student')}>{role==='student'?'Employer':'Student'} view</button>}<button className="ghost" onClick={()=>setTheme(theme==='light'?'dark':'light')}>{theme==='light'?'◐':'☀'}</button>{!logged&&<><Button variant="ghost" onClick={()=>go('login')}>Login</Button><Button onClick={()=>go('signup')}>Sign Up</Button></>}</div></header>
}
