import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
export function ExPaymentNotification(){
 const [visible,setVisible]=useState(false);
 useEffect(()=>{
  const arrival=setTimeout(()=>setVisible(true),2000);
  const expiry=setTimeout(()=>setVisible(false),8000);
  return()=>{clearTimeout(arrival);clearTimeout(expiry);};
 },[]);
 if(!visible)return null;
 return <aside className="ex-payment-notice" role="status" aria-label="Simulated Zelle notification"><div className="ex-payment-heading"><span className="ex-payment-logo" aria-hidden="true">Z</span><span><b>Zelle</b><small>Fictional payment alert · now</small></span><span className="ex-payment-simulated">SIMULATED</span><button className="icon-button" aria-label="Dismiss simulated payment" onClick={()=>setVisible(false)}><X size={16}/></button></div><div className="ex-payment-body"><span className="ex-payment-sender">Your Ex 💔 sent you</span><strong>$0.99</strong><p>“unblock me”</p></div><div className="ex-payment-footer">99¢ for closure. The bar is on the floor.</div></aside>;
}
