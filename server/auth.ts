/*
 * Mock accounts for ExChange, ported from the signup prototype's server.js. No database: accounts
 * live in a JSON file (data/accounts.json locally). Passwords are salted PBKDF2 hashes; sessions
 * are HMAC-signed HttpOnly cookies. This is NOT production authentication.
 */
import { createHmac, pbkdf2, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';

const pbkdf2Async=promisify(pbkdf2);
const PBKDF2_ITERATIONS=210000;
const STARTING_BALANCE=10000;
const SESSION_COOKIE='exchange_session';
const SESSION_SECONDS=60*60*24*7;
const EMAIL_PATTERN=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FAILED_LOGINS=10,FAILED_LOGIN_WINDOW_MS=15*60*1000;

type Env=Record<string,string|undefined>;
type PasswordHash={algorithm:'PBKDF2-SHA256';iterations:number;salt:string;hash:string};
type Account={id:string;email:string;alias:string;balance:number;createdAt:string;password:PasswordHash};
type Store={accounts:Account[];secret?:string};
export type PublicAccount=Omit<Account,'password'>;
export type AuthResult={status:number;body:unknown;cookie?:string};

function dataFile(env:Env){return env.AUTH_DATA_FILE||(env.VERCEL?'/tmp/exchange-accounts.json':join(process.cwd(),'data','accounts.json'));}

function readStore(file:string):Store{
 try{const store=JSON.parse(readFileSync(file,'utf8')) as Store;return Array.isArray(store.accounts)?store:{accounts:[]};}
 catch{return {accounts:[]};}
}
function writeStore(file:string,store:Store){
 mkdirSync(dirname(file),{recursive:true});
 writeFileSync(file+'.tmp',JSON.stringify(store,null,2)+'\n');
 renameSync(file+'.tmp',file);
}

// Serialize store access so two signups at once can't clobber each other.
let queue:Promise<unknown>=Promise.resolve();
function withStore<T>(env:Env,task:(store:Store,save:()=>void)=>Promise<T>|T):Promise<T>{
 const file=dataFile(env);
 const run=queue.then(()=>{const store=readStore(file);return task(store,()=>writeStore(file,store));});
 queue=run.catch(()=>{});
 return run;
}

// AUTH_SECRET wins; otherwise a random secret is generated once and kept beside the accounts.
function secretFor(store:Store,env:Env,save:()=>void){
 if(env.AUTH_SECRET)return env.AUTH_SECRET;
 if(!store.secret){store.secret=randomBytes(32).toString('base64');save();}
 return store.secret;
}

async function hashPassword(password:string):Promise<PasswordHash>{
 const salt=randomBytes(16),hash=await pbkdf2Async(password,salt,PBKDF2_ITERATIONS,32,'sha256');
 return {algorithm:'PBKDF2-SHA256',iterations:PBKDF2_ITERATIONS,salt:salt.toString('base64'),hash:hash.toString('base64')};
}
async function verifyPassword(password:string,stored:PasswordHash){
 const expected=Buffer.from(stored.hash,'base64');
 const actual=await pbkdf2Async(password,Buffer.from(stored.salt,'base64'),stored.iterations,expected.length,'sha256');
 return timingSafeEqual(actual,expected);
}

function sign(value:string,secret:string){return createHmac('sha256',secret).update(value).digest('base64url');}
function createSession(id:string,secret:string){
 const payload=Buffer.from(JSON.stringify({id,exp:Math.floor(Date.now()/1000)+SESSION_SECONDS})).toString('base64url');
 return `${payload}.${sign(payload,secret)}`;
}
function readSession(token:string|undefined,secret:string):string|null{
 const [payload,signature]=(token??'').split('.');
 if(!payload||!signature)return null;
 const expected=Buffer.from(sign(payload,secret)),given=Buffer.from(signature);
 if(expected.length!==given.length||!timingSafeEqual(expected,given))return null;
 try{const {id,exp}=JSON.parse(Buffer.from(payload,'base64url').toString('utf8')) as {id:string;exp:number};return exp>Date.now()/1000?id:null;}
 catch{return null;}
}
function sessionCookie(token:string,secure:boolean,maxAge=SESSION_SECONDS){
 return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure?'; Secure':''}`;
}
export function readCookie(header:string|undefined,name=SESSION_COOKIE){
 for(const part of (header??'').split(';')){const [key,...rest]=part.trim().split('=');if(key===name)return rest.join('=');}
 return undefined;
}

function publicAccount({password:_password,...rest}:Account):PublicAccount{return rest;}
function text(body:Record<string,unknown>,key:string){return typeof body[key]==='string'?body[key] as string:'';}

// The login page does full validation; this just refuses obviously bad input.
function validateSignup(body:Record<string,unknown>){
 const email=text(body,'email').trim().toLowerCase(),alias=text(body,'alias').trim(),password=text(body,'password'),length=Array.from(password).length;
 if(!EMAIL_PATTERN.test(email))return {field:'email',error:'Enter a valid email. Even your ex had one of those.'};
 if(alias.length<2||alias.length>24)return {field:'alias',error:'Alias must be 2–24 characters.'};
 if(length<8||length>128)return {field:'password',error:'Password doesn’t meet the requirements.'};
 return {email,alias,password};
}

const failedLogins=new Map<string,{at:number;count:number}>();

async function signup(body:Record<string,unknown>,secure:boolean,env:Env):Promise<AuthResult>{
 const input=validateSignup(body);
 if('error' in input)return {status:400,body:input};
 const password=await hashPassword(input.password);
 return withStore(env,(store,save)=>{
  if(store.accounts.some(a=>a.email===input.email))return {status:409,body:{field:'email',error:'That email already has an open position. Commitment? From you?'}};
  const account:Account={id:randomUUID(),email:input.email,alias:input.alias,balance:STARTING_BALANCE,createdAt:new Date().toISOString(),password};
  store.accounts.push(account);save();
  return {status:201,body:{account:publicAccount(account)},cookie:sessionCookie(createSession(account.id,secretFor(store,env,save)),secure)};
 });
}

async function login(body:Record<string,unknown>,secure:boolean,env:Env):Promise<AuthResult>{
 const email=text(body,'email').trim().toLowerCase(),password=text(body,'password'),now=Date.now();
 if(!email||!password)return {status:400,body:{error:'Email and password, please. We need both sides of the story.'}};
 const attempts=failedLogins.get(email);
 if(attempts&&now-attempts.at<FAILED_LOGIN_WINDOW_MS&&attempts.count>=MAX_FAILED_LOGINS)return {status:429,body:{error:'Too many attempts. Take a breather before you text again.'}};
 const {account,secret}=await withStore(env,(store,save)=>({account:store.accounts.find(a=>a.email===email),secret:secretFor(store,env,save)}));
 if(!account||!(await verifyPassword(password,account.password))){
  const entry=attempts&&now-attempts.at<FAILED_LOGIN_WINDOW_MS?attempts:{at:now,count:0};
  entry.count++;failedLogins.set(email,entry);
  return {status:401,body:{error:'Wrong email or password. You’ve been ghosted by your own credentials.'}};
 }
 failedLogins.delete(email);
 return {status:200,body:{account:publicAccount(account)},cookie:sessionCookie(createSession(account.id,secret),secure)};
}

async function me(cookieHeader:string|undefined,env:Env):Promise<AuthResult>{
 const account=await withStore(env,(store,save)=>{const id=readSession(readCookie(cookieHeader),secretFor(store,env,save));return id?store.accounts.find(a=>a.id===id):undefined;});
 return account?{status:200,body:{account:publicAccount(account)}}:{status:401,body:{error:'Not logged in.'}};
}

export const AUTH_ACTIONS={signup:'POST',login:'POST',logout:'POST',me:'GET'} as const;

export async function handleAuth(action:string,method:string|undefined,body:unknown,cookieHeader:string|undefined,secure:boolean,env:Env=process.env):Promise<AuthResult>{
 const expected=AUTH_ACTIONS[action as keyof typeof AUTH_ACTIONS];
 if(!expected)return {status:404,body:{error:'Not found.'}};
 if(method!==expected)return {status:405,body:{error:`Use ${expected}.`}};
 const input=(body&&typeof body==='object'?body:{}) as Record<string,unknown>;
 try{
  if(action==='signup')return await signup(input,secure,env);
  if(action==='login')return await login(input,secure,env);
  if(action==='logout')return {status:200,body:{ok:true},cookie:sessionCookie('',secure,0)};
  return await me(cookieHeader,env);
 }catch(error){
  console.error('Auth request failed:',error instanceof Error?error.message:error);
  return {status:500,body:{error:'Something broke. Unlike you, it will recover. Try again.'}};
 }
}
