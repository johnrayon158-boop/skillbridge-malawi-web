import React from 'react';

export default function Logo({small=false}){
  return <div className={'brand '+(small?'brand-small':'')}><div className="logo-mark"><span>⌃</span><i></i></div><div><b>SkillBridge</b><em>Malawi</em></div></div>
}
