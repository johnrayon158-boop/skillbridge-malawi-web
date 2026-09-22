import React from 'react';

export default function Stat({icon,label,value,progress}){return <div className="stat"><div className="stat-icon">{icon}</div><div><span>{label}</span><b>{value}</b>{progress&&<div className="progress-bar"><i style={{width:progress+'%'}}></i></div>}</div></div>}
