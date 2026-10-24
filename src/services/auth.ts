import { z } from 'zod';
const accountSchema=z.object({id:z.string().min(1),email:z.string().email(),alias:z.string().min(1).max(24),balance:z.number().finite(),createdAt:z.string().min(1)});
export type Account=z.infer<typeof accountSchema>;
export const LOGIN_URL='/login.html';
export const GUEST_URL='/?demo=1';
export type AuthSession={status:'authenticated';account:Account}|{status:'anonymous'|'unavailable'};
export async function getSession():Promise<AuthSession>{
 try{
  const response=await fetch('/api/auth/me',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(5000)});
  if(response.status===401)return {status:'anonymous'};
  if(!response.ok)return {status:'unavailable'};
  const result=z.object({account:accountSchema}).safeParse(await response.json());
  return result.success?{status:'authenticated',account:result.data.account}:{status:'unavailable'};
 }catch{return {status:'unavailable'};}
}
export async function currentAccount():Promise<Account|null>{
 const session=await getSession();return session.status==='authenticated'?session.account:null;
}
export async function logout(navigate:(url:string)=>void=url=>location.replace(url)){
 const response=await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin',signal:AbortSignal.timeout(5000)});
 if(!response.ok)throw new Error('Could not sign out. Please retry; your session has not been cleared.');
 navigate(LOGIN_URL+'#login');
}
