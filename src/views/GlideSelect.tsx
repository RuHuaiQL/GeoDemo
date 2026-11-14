import {useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type CSSProperties} from 'react';
import {createPortal} from 'react-dom';

type Option = {value: string; label: string; tag?: string};
type Props = {label: string; value: string; options: Option[]; onChange: (value: string) => void};

export default function GlideSelect({label,value,options,onChange}: Props) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const selected = Math.max(0,options.findIndex(item => item.value === value));
  const [open,setOpen] = useState(false);
  const [active,setActive] = useState(selected);
  const [position,setPosition] = useState<CSSProperties>({});
  function toggle() {setActive(selected); setOpen(!open);}
  function choose(index: number) {
    onChange(options[index].value);
    setOpen(false);
    trigger.current?.focus({preventScroll:true});
  }
  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const rect = trigger.current!.getBoundingClientRect();
      const width = Math.min(innerWidth-16, Math.max(rect.width,options.some(o => o.tag) ? 220 : 108));
      const height = Math.min(options.length*35+10,290);
      const above = innerHeight-rect.bottom < height+10 && rect.top > innerHeight-rect.bottom;
      setPosition({width,left:Math.max(8,Math.min(rect.left,innerWidth-width-8)),
        maxHeight:Math.max(48,Math.min(height,above ? rect.top-12 : innerHeight-rect.bottom-12)),
        ...(above ? {bottom:innerHeight-rect.top+5,transformOrigin:'bottom left'} : {top:rect.bottom+5})});
    }
    place();
    const outside = (e: PointerEvent) => {
      if (!trigger.current?.contains(e.target as Node) && !list.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('resize',place);
    window.addEventListener('scroll',place,true);
    document.addEventListener('pointerdown',outside);
    return () => {
      window.removeEventListener('resize',place);
      window.removeEventListener('scroll',place,true);
      document.removeEventListener('pointerdown',outside);
    };
  },[open,options.length]);
  useEffect(() => {
    if (open) document.getElementById(id+'-'+active)?.scrollIntoView({block:'nearest'});
  },[active,open,id]);
  function keys(e: KeyboardEvent) {
    if (e.key === 'Tab' || e.key === 'Escape') {setOpen(false); return;}
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); if (open) choose(active); else toggle(); return;
    }
    let index = open ? active : selected;
    if (e.key === 'ArrowDown') index = Math.min(options.length-1,index+1);
    else if (e.key === 'ArrowUp') index = Math.max(0,index-1);
    else if (e.key === 'Home') index = 0;
    else if (e.key === 'End') index = options.length-1;
    else if (e.key.length === 1) {
      const match = options.findIndex(item => item.label.toLowerCase().startsWith(e.key.toLowerCase()));
      if (match < 0) return;
      index = match;
    } else return;
    e.preventDefault(); setOpen(true); setActive(index);
  }
  const item = options[selected];
  return <>
    <button ref={trigger} type="button" className="glide-trigger" role="combobox" aria-label={label}
      aria-expanded={open} aria-haspopup="listbox" aria-controls={open?id:undefined}
      aria-activedescendant={open?id+'-'+active:undefined} onClick={toggle} onKeyDown={keys}>
      <span>{item.label}{item.tag && <small> · {item.tag}</small>}</span><i aria-hidden="true"/>
    </button>
    {open && createPortal(<div ref={list} id={id} role="listbox" aria-label={label} className="glide-list"
      style={position} onPointerDown={e=>{if(e.pointerType==='mouse') e.preventDefault();}}>
      <div className="glide-highlight" aria-hidden="true" style={{transform:'translateY('+active*35+'px)'}}/>
      {options.map((o,i)=><div key={o.value} role="option" id={id+'-'+i} aria-selected={i===selected}
        onPointerMove={e=>{if(e.pointerType!=='touch') setActive(i);}} onClick={()=>choose(i)}>
        <span>{o.label}</span>{o.tag && <small>{o.tag}</small>}<b aria-hidden="true">{i===selected?'✓':''}</b>
      </div>)}
    </div>,document.body)}
  </>;
}
