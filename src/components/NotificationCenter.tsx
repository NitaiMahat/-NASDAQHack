import { AnimatePresence, motion } from 'framer-motion';
import { Check, Sparkles, X } from 'lucide-react';
import type { Notice } from '../hooks/useNotifications';
export function NotificationCenter({notice,pending,onDismiss,animate}:{notice?:Notice;pending:number;onDismiss:()=>void;animate:boolean}){
 return <div className="notification-region" aria-label="Trading notifications"><AnimatePresence mode="wait">{notice&&<motion.div key={notice.id} role="status" className={`rage-toast notice-${notice.kind}`} initial={animate?{opacity:0,x:16}:false} animate={{opacity:1,x:0}} exit={{opacity:0}} transition={{duration:animate?.18:0}}><span className="toast-icon">{notice.kind==='achievement'?<Sparkles size={18}/>:<Check size={16}/>}</span><div><span>{notice.message}</span>{pending>0&&<small>{pending} more in the group chat</small>}</div><button className="icon-button" aria-label="Dismiss notification" onClick={onDismiss}><X size={15}/></button></motion.div>}</AnimatePresence></div>;
}
