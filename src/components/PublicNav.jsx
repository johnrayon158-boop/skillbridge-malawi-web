import React from 'react';
import Logo from './Logo';
import Button from './Button';
import Badge from './Badge';

export default function PublicNav({go,logged,role,page,switchRole,theme,setTheme}){
  return <header className="public-nav"><Logo/><nav><a className={location.hash==='#home'?'active':''} onClick={()=>go('home')}>Home</a><a className={location.hash==='#how'?'active':''} onClick={()=>go('how')}>How It Works</a><a className={location.hash==='#about'?'active':''} onClick={()=>go('about')}>About</a></nav><div className="nav-actions">{logged&&page!=='home'&&<button className="role-btn" onClick={switchRole}>⇄ Switch role</button>}<button className="ghost" onClick={()=>setTheme(theme==='light'?'dark':'light')}>{theme==='light'?'◐':'☀'}</button>{logged&&page!=='home'?<Button variant="ghost" onClick={switchRole}>Log out</Button>:<><Button variant="ghost" onClick={()=>go('login')}>Login</Button><Button onClick={()=>go('signup')}>Sign Up</Button></>}</div></header>
}
