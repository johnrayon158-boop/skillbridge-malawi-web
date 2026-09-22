import React from 'react';

export default function PanelHead({title,link,onClick}){return <div className="panel-head"><h2>{title}</h2>{link&&<button onClick={onClick}>{link} →</button>}</div>}
