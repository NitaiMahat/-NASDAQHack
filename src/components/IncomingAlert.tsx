import { useEffect, useState } from 'react';
import { Instagram, X } from 'lucide-react';
import type { MarketEvent, Stock } from '../types';
import { EventImpact } from './IncomingFeed';
import { messagePresentation } from '../services/messagePresentation';
export function IncomingAlert({event,stock,onOpen}:{event:MarketEvent|null;stock:Stock|undefined;onOpen:()=>void}){
 const [dismissed,setDismissed]=useState<string|null>(null);
 useEffect(()=>{if(!event)return;const timer=setTimeout(()=>setDismissed(event.id),6000);return()=>clearTimeout(timer);},[event]);
 if(!event||!stock||dismissed===event.id)return null;
 const presentation=messagePresentation(event,stock);
 return <aside className="incoming-alert" aria-label="New simulated incoming message"><div className="incoming-alert-top"><Instagram size={14}/><span>SIMULATED INSTAGRAM FEED</span><button className="icon-button" aria-label="Dismiss incoming message" onClick={()=>setDismissed(event.id)}><X size={15}/></button></div><button className="incoming-alert-body" onClick={onOpen}><span className="stock-avatar small" style={{background:stock.color+'20'}}>{presentation.avatar}</span><span><b>{presentation.sender}</b><span>{event.text}</span></span></button><div className="incoming-alert-impact"><b className={event.analysis.suggestedPercentChange>=0?'green':'red'}>{stock.ticker} {event.analysis.suggestedPercentChange>0?'+':''}{event.analysis.suggestedPercentChange}%</b><EventImpact event={event}/></div></aside>;
}
