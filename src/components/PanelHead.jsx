import React from 'react';

export default function PanelHead({title,link}){return <div className="panel-head"><h2>{title}</h2>{link&&<button>{link} →</button>}</div>}
