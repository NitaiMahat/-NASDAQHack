import { afterEach,describe,it,expect } from 'vitest';
import { mkdtempSync,readFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve, sep } from 'node:path';
import { handleAuth,readCookie } from '../server/auth';
import { createGame } from '../src/engine/market';
import { loadGame,saveGame,storageKey,STORAGE_KEY } from '../src/services/storage';
const dirs:string[]=[];
function env(){const dir=mkdtempSync(join(tmpdir(),'exchange-auth-'));dirs.push(dir);return {AUTH_DATA_FILE:join(dir,'accounts.json')};}
const cookieHeader=(setCookie?:string)=>setCookie?.split(';')[0];
const details={email:'Trader@Example.com',alias:'Delulu',password:'Correct-Horse-9'};
afterEach(()=>{for(const dir of dirs.splice(0)){if(!resolve(dir).startsWith(resolve(tmpdir())+sep)||!basename(dir).startsWith('exchange-auth-'))throw new Error('Refusing to clean a path outside the auth-test temp directory.');rmSync(dir,{recursive:true,force:true});}localStorage.clear();});
describe('mock account API',()=>{
 it('signs up, stores only a salted hash and starts a session',async()=>{
  const e=env(),result=await handleAuth('signup','POST',details,undefined,false,e);
  expect(result.status).toBe(201);expect(result.body).toMatchObject({account:{email:'trader@example.com',alias:'Delulu',balance:10000}});
  expect(result.cookie).toMatch(/^exchange_session=.+; Path=\/; HttpOnly; SameSite=Lax/);
  const file=readFileSync(e.AUTH_DATA_FILE,'utf8');expect(file).not.toContain(details.password);expect(JSON.parse(file).accounts[0].password.algorithm).toBe('PBKDF2-SHA256');
  expect(JSON.stringify(result.body)).not.toContain('salt');
  const me=await handleAuth('me','GET',undefined,cookieHeader(result.cookie),false,e);expect(me.status).toBe(200);expect(me.body).toMatchObject({account:{alias:'Delulu'}});
 });
 it('rejects duplicate emails and invalid input',async()=>{
  const e=env();await handleAuth('signup','POST',details,undefined,false,e);
  expect((await handleAuth('signup','POST',{...details,email:'trader@example.com'},undefined,false,e)).status).toBe(409);
  expect((await handleAuth('signup','POST',{...details,email:'nope'},undefined,false,e)).body).toMatchObject({field:'email'});
  expect((await handleAuth('signup','POST',{...details,password:'short'},undefined,false,e)).body).toMatchObject({field:'password'});
 });
 it('logs in with the right password only',async()=>{
  const e=env();await handleAuth('signup','POST',details,undefined,false,e);
  const wrong=await handleAuth('login','POST',{email:details.email,password:'wrong-password'},undefined,false,e);expect(wrong.status).toBe(401);expect(wrong.cookie).toBeUndefined();
  const right=await handleAuth('login','POST',{email:' TRADER@example.com ',password:details.password},undefined,true,e);expect(right.status).toBe(200);expect(right.cookie).toContain('; Secure');
  expect((await handleAuth('me','GET',undefined,cookieHeader(right.cookie),false,e)).status).toBe(200);
 });
 it('rejects missing, tampered and cleared sessions',async()=>{
  const e=env(),{cookie}=await handleAuth('signup','POST',details,undefined,false,e),token=readCookie(cookieHeader(cookie))!;
  expect((await handleAuth('me','GET',undefined,undefined,false,e)).status).toBe(401);
  const [payload,signature]=token.split('.'),forged=Buffer.from(JSON.stringify({id:'someone-else',exp:9999999999})).toString('base64url');
  expect((await handleAuth('me','GET',undefined,`exchange_session=${forged}.${signature}`,false,e)).status).toBe(401);
  expect((await handleAuth('me','GET',undefined,`exchange_session=${payload}.x${signature}`,false,e)).status).toBe(401);
  const out=await handleAuth('logout','POST',undefined,cookieHeader(cookie),false,e);expect(out.cookie).toContain('Max-Age=0');
  expect((await handleAuth('me','GET',undefined,cookieHeader(out.cookie),false,e)).status).toBe(401);
 });
 it('rejects unknown actions and wrong methods',async()=>{
  const e=env();expect((await handleAuth('admin','GET',undefined,undefined,false,e)).status).toBe(404);expect((await handleAuth('login','GET',undefined,undefined,false,e)).status).toBe(405);
 });
});
describe('per-account saves',()=>{
 it('keeps each account in its own slot and hands the pre-login save to the first account',()=>{
  const legacy=createGame('Before login');legacy.player.cash=123400;saveGame(legacy);
  expect(loadGame('a').player.cash).toBe(123400);expect(localStorage.getItem(STORAGE_KEY)).toBeNull();expect(localStorage.getItem(storageKey('a'))).not.toBeNull();
  expect(loadGame('b').player.cash).toBe(1000000);
  const b=createGame('B');b.player.cash=5000;saveGame(b,'b');expect(loadGame('b').player.cash).toBe(5000);expect(loadGame('a').player.cash).toBe(123400);
 });
});
