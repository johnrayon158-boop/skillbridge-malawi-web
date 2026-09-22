import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabaseClient';
import { readableSupabaseError } from '../lib/supabaseData';

export default function NotificationDropdown(){
  const { user } = useAuth();
  const [open,setOpen]=useState(false); const [count,setCount]=useState(0); const [items,setItems]=useState([]);
  const [error,setError]=useState(null);
  const fetchCount = async ()=>{ if(!user) return; const { count: unreadCount, error: queryError } = await supabase.from('notifications').select('id', { count:'exact', head:true }).eq('user_id', user.id).eq('read', false); if(queryError) setError(readableSupabaseError(queryError, 'Unable to load notifications.')); else setCount(unreadCount || 0); };
  const fetchItems = async ()=>{ if(!user) return; const { data, error: queryError } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending:false }).limit(100); if(queryError) setError(readableSupabaseError(queryError, 'Unable to load notifications.')); else setItems(data || []); };
  useEffect(()=>{ fetchCount(); },[user]);
  useEffect(()=>{ if(open) fetchItems(); },[open]);
  const markRead = async (id)=>{ const { error: updateError } = await supabase.from('notifications').update({ read:true }).eq('id', id).eq('user_id', user.id); if(updateError) setError(readableSupabaseError(updateError, 'Unable to update notification.')); else { fetchCount(); fetchItems(); } };
  const markAll = async ()=>{ const { error: updateError } = await supabase.from('notifications').update({ read:true }).eq('user_id', user.id).eq('read', false); if(updateError) setError(readableSupabaseError(updateError, 'Unable to update notifications.')); else { fetchCount(); fetchItems(); } };
  return <div className="notif-dropdown"><button className="icon" onClick={()=>setOpen(!open)}>{open?'✕':'●'}{count? <span className="badge">{count}</span>:null}</button>{open && <div className="dropdown"><div className="head"><b>Notifications</b><button onClick={markAll}>Mark all read</button></div>{error&&<div className="error">{error}</div>}<div className="list">{items.length? items.map(n=> <div key={n.id} className={'notice '+(n.read? 'read':'' )}><div><b>{n.title}</b><p>{n.message}</p></div><div><small>{new Date(n.created_at).toLocaleString()}</small>{!n.read&&<button onClick={()=>markRead(n.id)}>Mark read</button>}</div></div>) : <div className="empty">No notifications</div>}</div></div>}</div>;
}
