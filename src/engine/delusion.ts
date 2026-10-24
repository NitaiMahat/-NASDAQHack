import type { MarketEvent, Player, Stock, Trade } from '../types';
export const capDelusion=(value:number)=>Math.max(0,Math.min(100,Math.round(value)));
export function delusionLevel(score:number){
 if(score===100)return {title:'FINAL BOSS OF DELUSION',message:'YOU ARE NO LONGER A TRADER. YOU ARE THE PROBLEM.'};
 if(score>=76)return {title:'Beyond Saving',message:'The group chat has entered witness protection.'};
 if(score>=51)return {title:'Certified Delulu',message:'Bro thinks “haha” means marriage.'};
 if(score>=26)return {title:'Mildly Delusional',message:'One story like away from relapsing.'};
 return {title:'Emotionally Available',message:'You might actually be healing.'};
}
export function recentPeak(stock:Stock,time=stock.history.at(-1)?.time??0){return Math.max(stock.price,...stock.history.filter(p=>p.time>=time-120).map(p=>p.price));}
export function drawdown(stock:Stock,time?:number){return (recentPeak(stock,time)-stock.price)/recentPeak(stock,time)*100;}
export function canFixThem(stock:Stock,time?:number){return (stock.risk==='high'||stock.risk==='extreme')&&drawdown(stock,time)>=50;}
export function tradeDelusion(player:Player,stock:Stock,side:Trade['side'],realized:number,remaining:number,time:number,events:MarketEvent[],reason:Trade['reason']){
 let delta=0;
 const recent=events.find(e=>e.stockId===stock.id&&time-e.timestamp>=0&&time-e.timestamp<=45);
 if(side==='buy'){
  if(recent&&(recent.ruleId==='miss-you'||recent.text.toLowerCase().includes('miss you')))delta+=15;
  if(recent&&(recent.ruleId==='blocked'||recent.type==='block'))delta+=25;
  if((player.holdings[stock.id]?.quantity??0)>0&&drawdown(stock,time)>=20)delta+=20;
  if(reason==='fix-them')delta+=25;
 }else{
  if((stock.risk==='high'||stock.risk==='extreme')&&realized>0)delta-=10;
  if(remaining===0&&realized<0)delta-=15;
 }
 return capDelusion(player.delusion+delta)-player.delusion;
}
export function rewardRestraint(player:Player,events:MarketEvent[],time:number):Player{
 const due=events.filter(e=>e.analysis.suggestedPercentChange<=-30&&time>=e.timestamp+12&&!player.avoidedEvents.includes(e.id));
 if(!due.length)return player;
 const avoided=due.filter(e=>!player.trades.some(t=>t.time>=e.timestamp&&t.time<e.timestamp+12));
 return {...player,delusion:capDelusion(player.delusion-5*avoided.length),avoidedEvents:[...player.avoidedEvents,...due.map(e=>e.id)]};
}
