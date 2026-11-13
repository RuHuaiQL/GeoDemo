import {useState,type ReactNode} from 'react';
export default function FloatingPanel({id,title,children}:{id:string;title:string;children:ReactNode}){
 const [open,setOpen]=useState(()=>{try{return localStorage.getItem(id)==='true'}catch{return false}});
 return <div className={`floating-panel ${id} ${open?'is-open':''}`}><button className="panel-toggle" aria-expanded={open} aria-controls={id+'-body'} onClick={()=>{setOpen(!open);try{localStorage.setItem(id,String(!open))}catch{/* private browsing */}}}>{title} <span>{open?'−':'＋'}</span></button>{open&&<div id={id+'-body'} className="panel-body">{children}</div>}</div>;
}
