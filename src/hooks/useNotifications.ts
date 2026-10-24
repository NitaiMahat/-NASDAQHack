import { useCallback, useEffect, useRef, useState } from 'react';
export interface Notice {id:number;message:string;kind:'info'|'gain'|'loss'|'achievement'|'buy'|'sell'}
const ROASTS={
 buy:['Bro is investing in someone who doesn’t invest in them.','Financially irresponsible. Emotionally consistent.','Your group chat is going to love this.','You saw one green flag and forgot the entire relationship.','Buying the dip? The red flags are priced in.'],
 sell:['Finally, some character development.','Bro discovered self-respect.','Congratulations on choosing peace.','You moved on faster than your ex did.','Rare footage of you making a good decision.'],
 loss:['Your ex moved on. Your portfolio didn’t.','Even your Wi-Fi is more stable than this relationship.','You lost money AND aura. Impressive.','This portfolio needs a group chat, not technical analysis.','At least the heartbreak is free.'],
 gain:['Your first healthy relationship. With money.','Bro finally got a return on emotional investment.','The only green flag in your life is this chart.','Your fictional ex could never give you this much growth.','A dividend from the plot. Finally.'],
};
export function useNotifications(){
 const [queue,setQueue]=useState<Notice[]>([]),sequence=useRef(0),indexes=useRef<Record<string,number>>({});
 const notify=useCallback((message:string,kind:Notice['kind']='info')=>{const next={id:++sequence.current,message,kind};setQueue(q=>q.some(n=>n.message===message)?q:[...q,next].slice(0,6));},[]);
 const dismiss=useCallback(()=>setQueue(q=>q.slice(1)),[]);
 const current=queue[0];
 useEffect(()=>{if(!current)return;const timer=setTimeout(dismiss,4000);return()=>clearTimeout(timer);},[current,dismiss]);
 const roast=useCallback((kind:keyof typeof ROASTS)=>{const list=ROASTS[kind],index=indexes.current[kind]??0;indexes.current[kind]=index+1;return list[index%list.length];},[]);
 return {notice:current,pending:Math.max(0,queue.length-1),notify,dismiss,roast};
}
