import { analyzeFallback } from '../engine/sentiment';
import type { Analysis } from '../types';
import { analysisSchema } from '../engine/sentiment';
export async function analyzeEvent(input:{id:string;stockId:string;text:string;type:string;source:string},ticker:string):Promise<Analysis>{
 try {
  const response=await fetch('/api/analyze-event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal:AbortSignal.timeout(5500)});
  if(!response.ok)throw new Error('Analysis unavailable');
  const result=await response.json() as {analysis:unknown;method:unknown};
  return {...analysisSchema.parse(result.analysis),method:result.method==='llm'?'llm':'rules'};
 }catch{return analyzeFallback(input.text,input.type,ticker);}
}
