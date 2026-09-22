import React, { useEffect, useState } from 'react';

export default function NotificationDropdown(){
  const [open,setOpen]=useState(false); const [count,setCount]=useState(0); const [items,setItems]=useState([]);
  const fetchCount = async ()=>{ const r=await fetch('/api/notifications/unread/count', { headers: { Authorization: `Bearer ${localStorage.getItem('sb_token')}` } }); const d=await r.json(); if(r.ok) setCount(d.count); };
  const fetchItems = async ()=>{ const r=await fetch('/api/notifications', { headers: { Authorization: `Bearer ${localStorage.getItem('sb_token')}` } }); const d=await r.json(); if(r.ok) setItems(d); };
  useEffect(()=>{ fetchCount(); },[]);
  useEffect(()=>{ if(open) fetchItems(); },[open]);
  const markRead = async (id)=>{ await fetch('/api/notifications/mark-read/'+id, { method:'POST', headers: { Authorization: `Bearer ${localStorage.getItem('sb_token')}` } }); fetchCount(); fetchItems(); };
  const markAll = async ()=>{ await fetch('/api/notifications/mark-all-read', { method:'POST', headers: { Authorization: `Bearer ${localStorage.getItem('sb_token')}` } }); fetchCount(); fetchItems(); };
  return <div className="notif-dropdown"><button className="icon" onClick={()=>setOpen(!open)}>{open?'✕':'●'}{count? <span className="badge">{count}</span>:null}</button>{open && <div className="dropdown"><div className="head"><b>Notifications</b><button onClick={markAll}>Mark all read</button></div><div className="list">{items.length? items.map(n=> <div key={n.id} className={'notice '+(n.read? 'read':'' )}><div><b>{n.title}</b><p>{n.body}</p></div><div><small>{new Date(n.created_at).toLocaleString()}</small><button onClick={()=>markRead(n.id)}>Mark read</button></div></div>) : <div className="empty">No notifications</div>}</div></div>}</div>;
}
