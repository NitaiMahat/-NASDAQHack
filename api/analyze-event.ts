import type { VercelRequest,VercelResponse } from '@vercel/node';
import { ZodError } from 'zod';
import { analyzeOnServer } from '../server/analyze';
const requests=new Map<string,{at:number;count:number}>();
export default async function handler(req:VercelRequest,res:VercelResponse){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Use POST to analyze a fictional event.'});}
 const ip=String(req.headers['x-forwarded-for']??'local').split(',')[0];const now=Date.now();
 if(requests.size>1000)for(const [key,entry] of requests)if(now-entry.at>60000)requests.delete(key);
 const previous=requests.get(ip),window=previous&&now-previous.at<60000?previous:{at:now,count:0};
 if(window.count>=20)return res.status(429).json({error:'Drama quota reached. Local rules remain available.'});
 window.count++;requests.set(ip,window);
 try{const body=typeof req.body==='string'?JSON.parse(req.body):req.body;const analysis=await analyzeOnServer(body);return res.status(200).json({analysis,method:analysis.method});}
 catch(error){return res.status(400).json({error:error instanceof ZodError?'Invalid fictional event.':error instanceof Error?error.message:'Invalid request.'});}
}
