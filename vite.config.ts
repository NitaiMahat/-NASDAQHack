import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { analyzeOnServer } from './server/analyze';
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
  }
 }],
 test:{environment:'jsdom',setupFiles:['./tests/setup.ts'],restoreMocks:true},
 build:{rollupOptions:{output:{manualChunks:{charts:['recharts'],motion:['framer-motion']}}}}
}));
