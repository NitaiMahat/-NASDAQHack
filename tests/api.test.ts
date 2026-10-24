import { describe,it,expect,vi } from 'vitest';
import type { VercelRequest,VercelResponse } from '@vercel/node';
import handler from '../api/analyze-event';
function response(){const res={status:vi.fn(),json:vi.fn(),setHeader:vi.fn()};res.status.mockReturnValue(res);return res;}
describe('serverless analysis HTTP contract',()=>{
 it('rejects unsupported methods',async()=>{const res=response();await handler({method:'GET',headers:{}} as unknown as VercelRequest,res as unknown as VercelResponse);expect(res.status).toHaveBeenCalledWith(405);expect(res.setHeader).toHaveBeenCalledWith('Allow','POST');});
 it('rejects malformed and unknown-stock payloads',async()=>{for(const body of [{text:'x'},{id:'bad-stock',stockId:'unknown',type:'message',source:'simulated',text:'hello'}]){const res=response();await handler({method:'POST',headers:{'x-forwarded-for':'unit-invalid'},body} as unknown as VercelRequest,res as unknown as VercelResponse);expect(res.status).toHaveBeenCalledWith(400);}});
 it('returns fallback analysis without credentials and disables caching',async()=>{vi.stubEnv('LLM_API_KEY','');const res=response();await handler({method:'POST',headers:{'x-forwarded-for':'unit-valid'},body:{id:'api-test',stockId:'toxic',type:'message',source:'simulated',text:'I miss you'}} as unknown as VercelRequest,res as unknown as VercelResponse);expect(res.status).toHaveBeenCalledWith(200);expect(res.json).toHaveBeenCalledWith(expect.objectContaining({method:'rules',analysis:expect.objectContaining({suggestedPercentChange:25})}));expect(res.setHeader).toHaveBeenCalledWith('Cache-Control','no-store');vi.unstubAllEnvs();});
 it('limits model analysis request volume per warm instance',async()=>{vi.stubEnv('LLM_API_KEY','');for(let i=0;i<21;i++){const res=response();await handler({method:'POST',headers:{'x-forwarded-for':'unit-rate-test'},body:{id:`rate-${i}`,stockId:'toxic',type:'message',source:'simulated',text:'hello'}} as unknown as VercelRequest,res as unknown as VercelResponse);if(i===20)expect(res.status).toHaveBeenCalledWith(429);}vi.unstubAllEnvs();});
});

