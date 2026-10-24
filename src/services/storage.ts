import { createGame, makePlayer } from '../engine/market';
import type { Game, Holding, Player } from '../types';
export const STORAGE_KEY='exchange-game-v1';
// Each logged-in account gets its own save; without an account the shared local key is used.
export function storageKey(accountId?:string){return accountId?`${STORAGE_KEY}:${accountId}`:STORAGE_KEY;}
function readSave(accountId?:string){
 const key=storageKey(accountId),own=localStorage.getItem(key);
 if(own||!accountId)return own;
 // The first account to log in on this browser inherits the pre-login save.
 const legacy=localStorage.getItem(STORAGE_KEY);
 if(legacy){localStorage.setItem(key,legacy);localStorage.removeItem(STORAGE_KEY);}
 return legacy;
}
export function loadGame(accountId?:string):Game {
 try{
  const parsed=JSON.parse(readSave(accountId)??'null') as (Omit<Game,'version'>&{version:number})|null;
  if(parsed&&(parsed.version===1||parsed.version===2)&&parsed.stocks.length>=5&&Number.isSafeInteger(parsed.player.cash)&&parsed.player.cash>=0&&Array.isArray(parsed.processedEvents)&&parsed.stocks.every(s=>Number.isSafeInteger(s.price)&&s.price>=50&&s.price<=500000)){
   const fresh=createGame(parsed.player.name);
   const stocks=parsed.stocks.map(s=>{const config=fresh.stocks.find(n=>n.id===s.id);return {...s,name:config?.name??s.name,ticker:config?.ticker??s.ticker,risk:config?.risk??s.risk??(s.toxicity>75?'extreme':s.toxicity>60?'high':'medium')};});
   // Add the new roster without deleting legacy stocks, money, or positions.
   if(parsed.version===1)stocks.push(...fresh.stocks.filter(s=>!stocks.some(old=>old.id===s.id)));
   return {...parsed,version:2,stocks,player:normalizePlayer(parsed.player),bots:parsed.bots.map(normalizePlayer),events:parsed.events.map(e=>({...e,processed:true})),scheduledEvents:parsed.scheduledEvents??[],feedMode:parsed.feedMode==='chaos'?'chaos':'judge',nextChaosAt:parsed.nextChaosAt??parsed.elapsed+10,chaosSequence:parsed.chaosSequence??0};
  }
 }catch{/* Invalid browser data starts a fresh demo. */}
 return createGame();
}
function normalizePlayer(player:Player):Player{
 const replay:Record<string,Holding>={};
 const trades=player.trades.map(t=>{
  const h=replay[t.stockId]??{quantity:0,costCents:0,openedAt:t.time};
  const removed=t.side==='sell'?(t.quantity===h.quantity?h.costCents:Math.round(h.costCents*t.quantity/h.quantity)):0;
  replay[t.stockId]={quantity:t.resultingQuantity,costCents:h.costCents+(t.side==='buy'?t.quantity*t.price+t.fee:-removed),openedAt:h.quantity===0?t.time:h.openedAt};
  return {...t,realizedPnL:t.realizedPnL??(t.side==='sell'?t.quantity*t.price-t.fee-removed:0),delusionChange:t.delusionChange??0,reason:t.reason??'normal'};
 });
 const holdings=Object.fromEntries(Object.entries(player.holdings).map(([id,h])=>[id,{...h,openedAt:h.openedAt??replay[id]?.openedAt??0}]));
 return {...makePlayer(player.id,player.name,player.avatar),...player,trades,holdings};
}
export function saveGame(game:Game,accountId?:string){try{localStorage.setItem(storageKey(accountId),JSON.stringify(game));return true;}catch{return false;}}
