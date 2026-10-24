import type { MarketEvent, Player, Stock, Trade } from '../types';
import { canFixThem, tradeDelusion } from './delusion';
export function portfolio(player:Player,stocks:Stock[]) {
 const value=stocks.reduce((n,s)=>n+(player.holdings[s.id]?.quantity??0)*s.price,0);
 const cost=Object.values(player.holdings).reduce((n,h)=>n+h.costCents,0);
 return {value,netWorth:player.cash+value,unrealized:value-cost,realized:player.realized,cost};
}
export function trade(player:Player,stock:Stock,side:'buy'|'sell',quantity:number,id:string,time:number,canTrade=true,context:{events?:MarketEvent[];reason?:Trade['reason']}={}):Player {
 if(player.trades.some(t=>t.id===id))return player;
 if(!canTrade)throw new Error('The market is closed or paused.');
 if(stock.haltUntil>time)throw new Error('Circuit breaker active. Take a breath and try again.');
 if(!Number.isSafeInteger(quantity)||quantity<1||quantity>1_000_000)throw new Error('Enter a positive whole number of shares.');
 const gross=quantity*stock.price,fee=Math.round(gross*.005);
 if(!Number.isSafeInteger(gross))throw new Error('Order is too large.');
 const holding=player.holdings[stock.id]??{quantity:0,costCents:0,openedAt:time};
 const reason=context.reason??'normal';
 if(reason==='fix-them'&&(side!=='buy'||quantity!==1||!canFixThem(stock,time)))throw new Error('This recovery bet is only available for one share after a 50% high-risk drawdown.');
 if(side==='buy'&&gross+fee>player.cash)throw new Error('Not enough Emotional Capital for this order and fee.');
 if(side==='sell'&&quantity>holding.quantity)throw new Error('You cannot sell more shares than you own.');
 const removedCost=side==='sell'?quantity===holding.quantity?holding.costCents:Math.round(holding.costCents*quantity/holding.quantity):0;
 const updated={quantity:holding.quantity+(side==='buy'?quantity:-quantity),costCents:holding.costCents+(side==='buy'?gross+fee:-removedCost),openedAt:holding.quantity===0?time:holding.openedAt};
 const cash=player.cash+(side==='buy'?-gross-fee:gross-fee);
 const realizedPnL=side==='sell'?gross-fee-removedCost:0;
 const delusionChange=tradeDelusion(player,stock,side,realizedPnL,updated.quantity,time,context.events??[],reason);
 const delusion=player.delusion+delusionChange;
 return {...player,cash,realized:player.realized+realizedPnL,delusion,finalBossAchieved:player.finalBossAchieved||delusion===100,holdings:{...player.holdings,[stock.id]:updated},trades:[...player.trades,{id,stockId:stock.id,side,quantity,price:stock.price,fee,time,balance:cash,resultingQuantity:updated.quantity,realizedPnL,delusionChange,reason}]};
}
