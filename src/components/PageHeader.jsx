import React from 'react';
import Badge from './Badge';

export default function PageHeader({eyebrow,title,description,action}){return <div className="page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description&&<p>{description}</p>}</div>{action}</div>}
