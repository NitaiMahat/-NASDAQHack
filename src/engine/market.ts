import { STOCKS, SCENARIO } from '../content';
import type { Analysis, Game, Player } from '../types';
import { eventInput, resolveAnalysis } from './sentiment';
import { trade } from './trading';
import { matchRule, ruleById, STORYLINES } from './eventCatalog';
import { rewardRestraint } from './delusion';
export function random(seed:number){let x=seed|0;x^=x<<13;x^=x>>>17;x^=x<<5;return {seed:x>>>0,value:(x>>>0)/4294967296};}
export const clampPrice=(p:number)=>Math.max(50,Math.min(500000,Math.round(p)));
export function makePlayer(id='local',name='You',avatar='😎'):Player{return {id,name,avatar,cash:1000000,holdings:{},realized:0,bailoutUsed:false,trades:[],delusion:0,finalBossAchieved:false,bankruptcySeen:false,avoidedEvents:[]};}
export function createGame(name='You',seed=420):Game {
 const stocks=STOCKS.map(s=>{
  const history=Array.from({length:45},(_,i)=>({time:(i-44)*3,price:s.basePrice}));
  return {...s,price:s.basePrice,target:s.basePrice,haltUntil:0,momentum:0,history};
 });
 return {version:2,seed,tick:0,elapsed:0,duration:300,speed:1,status:'ready',stocks,player:makePlayer('local',name),bots:[makePlayer('bot-1','delulu.capital','🦄'),makePlayer('bot-2','emotionally_short','👻'),makePlayer('bot-3','greenflag_enthusiast','🌱')],events:[],processedEvents:[],scenarioIndex:0,startedAt:null,scheduledEvents:[]};
}
export function ingest(game:Game,input:unknown,provided?:Analysis):Game {
 const e=eventInput.parse(input);
 if(game.processedEvents.includes(e.id))return game;
 const stock=game.stocks.find(s=>s.id===e.stockId);if(!stock)throw new Error('Relationship stock not found.');
 const rule=e.ruleId?ruleById(e.ruleId):matchRule(e.text,e.type);
 const analysis=resolveAnalysis(e.text,e.type,stock.ticker,provided,e.ruleId);
 const major=Math.abs(analysis.suggestedPercentChange)>=30;
 const lastMajor=game.events.find(ev=>ev.stockId===stock.id&&Math.abs(ev.analysis.suggestedPercentChange)>=30);
 if(major&&lastMajor&&game.elapsed-lastMajor.timestamp<12)throw new Error('Let the plot breathe. Major events on this stock need 12 market seconds between reveals.');
 const target=clampPrice(stock.price*(1+analysis.suggestedPercentChange/100));
 const event={...e,text:e.ruleId?rule!.text:e.text,ruleId:rule?.id,timestamp:game.elapsed,analysis,priceBefore:stock.price,targetAfter:target,processed:true};
 return {...game,processedEvents:[...game.processedEvents,e.id],events:[event,...game.events].slice(0,100),stocks:game.stocks.map(s=>s.id===stock.id?{...s,price:target,target,momentum:0,history:[...s.history.filter(p=>p.time!==game.elapsed),{time:game.elapsed,price:target}].slice(-240),status:rule?.status??s.status,sentiment:analysis.sentimentScore,toxicity:Math.max(0,Math.min(100,s.toxicity+(analysis.suggestedPercentChange<0?3:-1))),haltUntil:major?game.elapsed+6:s.haltUntil}:s)};
}
export function scheduleStoryline(game:Game,storyId:string,stockId:string,id:string):Game{
 if(game.status!=='running')throw new Error('Open the market before starting a storyline.');
 if(!game.stocks.some(s=>s.id===stockId))throw new Error('Relationship stock not found.');
 const story=STORYLINES.find(s=>s.id===storyId);if(!story)throw new Error('Unknown storyline.');
 if(game.scheduledEvents.some(e=>e.stockId===stockId))throw new Error('A storyline is already playing on this stock.');
 if(game.elapsed+story.events.at(-1)!.offset+2>game.duration)throw new Error('Not enough time left. Start a fresh round for this storyline.');
 const entries=story.events.map((e,i)=>({id:`${id}-${i}`,stockId,ruleId:e.ruleId,at:game.elapsed+2+e.offset,storyId}));
 return {...game,scheduledEvents:[...game.scheduledEvents,...entries].sort((a,b)=>a.at-b.at)};
}
export function advance(game:Game,seconds=2):Game {
 if(game.status!=='running')return game;
 const elapsed=Math.min(game.duration,Math.round((game.elapsed+seconds)*1e6)/1e6),tick=game.tick+1;
 const seed=random(game.seed).seed;
 // Quiet ticks preserve prices: every move must have an event receipt.
 const stocks=game.stocks.map(s=>({...s,history:[...s.history,{time:elapsed,price:s.price}].slice(-240)}));
 let next:Game={...game,elapsed,tick,seed,stocks,status:elapsed>=game.duration?'finished':'running'};
 while(next.scenarioIndex<SCENARIO.length&&elapsed>=SCENARIO[next.scenarioIndex].at){
  const event=SCENARIO[next.scenarioIndex],rule=ruleById(event.ruleId)!;
  try{next=ingest(next,{id:`scenario-${next.scenarioIndex}`,stockId:'toxic',type:rule.type,source:'simulated',text:rule.text,ruleId:rule.id});}catch{break;}
  next={...next,scenarioIndex:next.scenarioIndex+1};
 }
 for(const scheduled of [...next.scheduledEvents]){
  if(scheduled.at>elapsed)continue;
  const rule=ruleById(scheduled.ruleId)!;
  try{next=ingest(next,{id:scheduled.id,stockId:scheduled.stockId,type:rule.type,source:'simulated',text:rule.text,ruleId:rule.id});next={...next,scheduledEvents:next.scheduledEvents.filter(e=>e.id!==scheduled.id)};}
  catch{next={...next,scheduledEvents:next.scheduledEvents.map(e=>e.id===scheduled.id?{...e,at:elapsed+2}:e)};}
 }
 next={...next,player:rewardRestraint(next.player,next.events,elapsed),bots:next.bots.map(b=>rewardRestraint(b,next.events,elapsed))};
 if(tick%6===0&&next.status==='running'){
  const bots=next.bots.map((bot,i)=>{const s=next.stocks[(tick+i*7)%next.stocks.length];try{return trade(bot,s,bot.holdings[s.id]?.quantity?'sell':'buy',bot.holdings[s.id]?.quantity??(i+1)*3,`bot-${tick}-${i}`,elapsed,true,{events:next.events});}catch{return bot;}});
  next={...next,bots};
 }
 return next;
}
