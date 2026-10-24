import { AnimatePresence, motion } from 'framer-motion';
import { Check, Sparkles, X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Notice } from '../hooks/useNotifications';
export function NotificationCenter({notice,pending,onDismiss,animate,children}:{notice?:Notice;pending:number;onDismiss:()=>void;animate:boolean;children?:ReactNode}){
 const isTrade=notice?.kind==='buy'||notice?.kind==='sell';
 const split=notice?.message.indexOf('. ')??-1;
 const receipt=notice&&split>=0?notice.message.slice(0,split+1):notice?.message;
 const roast=notice&&split>=0?notice.message.slice(split+2):'';
 return <div className="notification-region" aria-label="Trading notifications"><AnimatePresence mode="wait">{notice&&<motion.div key={notice.id} role="status" className={`rage-toast notice-${notice.kind} ${isTrade?'trade-toast':''}`} initial={animate?{opacity:0,y:18,scale:isTrade?.94:1}:false} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0}} transition={{duration:animate?.22:0}}>{isTrade?<><div className="trade-toast-top"><span><Check size={13}/> ORDER FILLED · {notice.kind.toUpperCase()}</span><button className="icon-button" aria-label="Dismiss notification" onClick={onDismiss}><X size={20}/></button></div><div className="trade-toast-main"><span className="trade-clown" aria-hidden="true">🤡</span><div><span className="trade-toast-title">{notice.kind==='buy'?'Emotionally invested.':'Character development.'}</span><span className="trade-toast-receipt">{receipt}</span></div></div>{roast&&<p className="trade-toast-roast">“{roast}”</p>}<div className="trade-toast-bottom"><span>Virtual money. Real clown behavior.</span>{pending>0&&<small>{pending} more in the group chat</small>}</div></>:<><span className="toast-icon">{notice.kind==='achievement'?<Sparkles size={18}/>:<Check size={16}/>}</span><div><span>{notice.message}</span>{pending>0&&<small>{pending} more in the group chat</small>}</div><button className="icon-button" aria-label="Dismiss notification" onClick={onDismiss}><X size={15}/></button></>}</motion.div>}</AnimatePresence>{children}</div>;
}
