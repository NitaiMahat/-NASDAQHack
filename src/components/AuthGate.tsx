import { useEffect, useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import App from '../App';
import { BRAND, BRAND_EXPANSION } from '../brand';
import { getSession, GUEST_URL, LOGIN_URL, type AuthSession } from '../services/auth';
const navigateTo=(url:string)=>location.replace(url);
export function AuthGate({navigate=navigateTo}:{navigate?:(url:string)=>void}){
 const [guest,setGuest]=useState(()=>new URLSearchParams(location.search).get('demo')==='1');
 const [session,setSession]=useState<AuthSession|{status:'loading'}>({status:'loading'}),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  if(guest)return;
  let active=true;
  void getSession().then(result=>{if(!active)return;setSession(result);if(result.status==='anonymous')navigate(LOGIN_URL);});
  return()=>{active=false;};
 },[guest,attempt,navigate]);
 if(guest)return <App key="guest"/>;
 if(session.status==='authenticated')return <App key={session.account.id} account={session.account}/>;
 const unavailable=session.status==='unavailable';
 return <main className="auth-loading"><section className="panel"><span className="eyebrow green"><ShieldCheck size={17}/> FICTIONAL RELATIONSHIP EXCHANGE</span><h1>{BRAND}</h1><p className="brand-expansion">{BRAND_EXPANSION}</p><h2>{unavailable?'The account service is unavailable.':session.status==='anonymous'?'Taking you to sign in…':'Checking your trading-floor pass…'}</h2><p>{unavailable?'Your existing browser saves are safe. Retry your session or enter the local guest demo.':'Mock accounts. Virtual money. Real commitment issues.'}</p>{unavailable&&<button className="primary" onClick={()=>{setSession({status:'loading'});setAttempt(n=>n+1);}}>Retry account service</button>}<a className="secondary" href={LOGIN_URL}>Sign in / create an account <ArrowRight size={15}/></a><a className="text-button" href={GUEST_URL} onClick={e=>{e.preventDefault();history.replaceState(null,'',GUEST_URL);setGuest(true);}}>Continue as guest — no account needed</a></section></main>;
}
