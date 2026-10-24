import { z } from 'zod';
import type { Analysis } from '../types';
import { matchRule, ruleById } from './eventCatalog';
export const eventInput=z.object({id:z.string().min(1).max(100),stockId:z.string().min(1).max(30),type:z.enum(['message','block','unfollow','like','relationship_update','manual_event']),source:z.enum(['simulated','manual']),text:z.string().trim().min(1).max(500),ruleId:z.string().refine(id=>Boolean(ruleById(id)),'Unknown gameplay rule.').optional()});
export const analysisSchema=z.object({sentiment:z.enum(['positive','negative','neutral','ambiguous']),sentimentScore:z.number().finite().transform(n=>Math.max(-1,Math.min(1,n))),significance:z.number().finite().transform(n=>Math.max(0,Math.min(1,n))),confidence:z.number().finite().transform(n=>Math.max(0,Math.min(1,n))),suggestedPercentChange:z.number().finite().transform(n=>Math.max(-45,Math.min(30,n))),headline:z.string().min(1).max(250),roast:z.string().min(1).max(300),reasoning:z.string().min(1).max(500)});
export function analyzeFallback(text:string,type='message',ticker='TOXIC',ruleId?:string):Analysis {
 const rule=ruleId?ruleById(ruleId):matchRule(text,type),impact=rule?.impact??0;
 return {...analysisSchema.parse({sentiment:impact>0?'positive':impact<0?'negative':'neutral',sentimentScore:impact/45,significance:Math.abs(impact)/45,confidence:rule? .91:.55,suggestedPercentChange:impact,headline:`${ticker}: ${rule?.headline??'Market awaits a clearer signal.'}`,roast:rule?.roast??'No signal detected. The delusion remains entirely self-funded.',reasoning:`Fictional gameplay rule: ${impact>0?'+':''}${impact}% applied to the current share price, rounded to the nearest cent. This is narrative sentiment, not a prediction about people.`}),method:'rules'};
}
export function resolveAnalysis(text:string,type:string,ticker:string,provided?:Analysis,ruleId?:string):Analysis {
 const fallback=analyzeFallback(text,type,ticker,ruleId);
 if(!provided)return fallback;
 const validated=analysisSchema.parse(provided),rule=ruleId?ruleById(ruleId):matchRule(text,type);
 // Known narratives always use their published rule. Unknown AI classifications use small, fixed moves.
 const impact=rule?rule.impact:validated.sentiment==='positive'?5:validated.sentiment==='negative'?-8:0;
 return {...validated,...(rule?{sentiment:fallback.sentiment,sentimentScore:fallback.sentimentScore}:{}),method:provided.method,suggestedPercentChange:impact,reasoning:`Controlled gameplay movement: ${impact>0?'+':''}${impact}% of the current price. ${rule?'Published narrative rule.':'AI classification mapped to a fixed rule; no arbitrary model pricing.'}`};
}
