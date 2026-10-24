import type { VercelRequest,VercelResponse } from '@vercel/node';
import { handleAuth } from '../../server/auth';
export default async function handler(req:VercelRequest,res:VercelResponse){
 res.setHeader('Cache-Control','no-store');
 let body:unknown=req.body;
 try{if(typeof body==='string')body=JSON.parse(body);}catch{return res.status(400).json({error:'Malformed request. Much like your last situationship.'});}
 const result=await handleAuth(String(req.query.action??''),req.method,body,req.headers.cookie,req.headers['x-forwarded-proto']==='https');
 if(result.cookie)res.setHeader('Set-Cookie',result.cookie);
 return res.status(result.status).json(result.body);
}
