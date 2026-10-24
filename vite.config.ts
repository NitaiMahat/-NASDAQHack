import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { analyzeOnServer } from './server/analyze';
import { handleAuth } from './server/auth';
export default defineConfig(({mode})=>({
 plugins:[react(),tailwindcss(),{
  name:'local-analysis-api',
  configureServer(server){
   const env=loadEnv(mode,process.cwd(),'');
   server.middlewares.use('/api/analyze-event',async(req,res)=>{
    res.setHeader('Content-Type','application/json');
    res.setHeader('Cache-Control','no-store');
    if(req.method!=='POST'){res.statusCode=405;res.end(JSON.stringify({error:'Use POST.'}));return;}
    let raw='';
    try{
     for await(const chunk of req){
      raw+=String(chunk);
      if(raw.length>4096){res.statusCode=413;res.end(JSON.stringify({error:'Event too large.'}));return;}
     }
     const analysis=await analyzeOnServer(JSON.parse(raw),env);
     res.end(JSON.stringify({analysis,method:analysis.method}));
    }catch{res.statusCode=400;res.end(JSON.stringify({error:'Invalid fictional event.'}));}
   });
   server.middlewares.use('/api/auth',async(req,res)=>{
    res.setHeader('Content-Type','application/json');
    res.setHeader('Cache-Control','no-store');
    let raw='';
    for await(const chunk of req){
     raw+=String(chunk);
     if(raw.length>10240){res.statusCode=413;res.end(JSON.stringify({error:'Request too large.'}));return;}
    }
    let body:unknown={};
    try{if(raw)body=JSON.parse(raw);}catch{res.statusCode=400;res.end(JSON.stringify({error:'Malformed request. Much like your last situationship.'}));return;}
    const action=(req.url??'').split('?')[0].replace(/^\/+|\/+$/g,'');
    const result=await handleAuth(action,req.method,body,req.headers.cookie,false,env);
    if(result.cookie)res.setHeader('Set-Cookie',result.cookie);
    res.statusCode=result.status;res.end(JSON.stringify(result.body));
   });
  }
 }],
 test:{environment:'jsdom',setupFiles:['./tests/setup.ts'],restoreMocks:true},
 build:{rollupOptions:{input:{main:'index.html',login:'login.html'},output:{manualChunks:{charts:['recharts'],motion:['framer-motion']}}}}
}));
