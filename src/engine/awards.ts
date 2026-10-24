import { portfolio } from './trading';
import type { Game, Player } from '../types';
export interface Award {id:string;title:string;emoji:string;player:Player;receipt:string}
export function shameAwards(game:Game):Award[]{
 const players=[game.player,...game.bots],awards:Award[]=[];
 const highest=[...players].sort((a,b)=>b.delusion-a.delusion||a.id.localeCompare(b.id))[0];
 if(highest.delusion>0)awards.push({id:'delulu',title:'Delulu of the Day',emoji:'🦄',player:highest,receipt:`${highest.delusion}/100 Delusion Meter`});
 const bags=players.flatMap(player=>game.stocks.flatMap(stock=>{const h=player.holdings[stock.id];const priceFell=player.trades.some(t=>t.stockId===stock.id&&t.side==='buy'&&t.time>=h?.openedAt&&t.price>stock.price);if(!h?.quantity||!priceFell||game.elapsed<=h.openedAt||h.quantity*stock.price>=h.costCents)return [];return [{player,stock,seconds:game.elapsed-h.openedAt,loss:(h.quantity*stock.price-h.costCents)/h.costCents*100}];})).sort((a,b)=>a.loss-b.loss||b.seconds-a.seconds||a.player.id.localeCompare(b.player.id));
 if(bags[0])awards.push({id:'bag',title:'Professional Bag Holder',emoji:'🧳',player:bags[0].player,receipt:`${bags[0].stock.ticker}: ${bags[0].loss.toFixed(1)}%, held ${Math.floor(bags[0].seconds)} market seconds`});
 const missed=players.flatMap(player=>player.trades.flatMap(t=>{if(t.side!=='sell')return [];const rally=game.events.find(e=>e.stockId===t.stockId&&e.timestamp>t.time&&e.timestamp-t.time<=20&&e.analysis.suggestedPercentChange>=20);return rally?[{player,trade:t,rally}]:[];})).sort((a,b)=>b.rally.analysis.suggestedPercentChange-a.rally.analysis.suggestedPercentChange||a.player.id.localeCompare(b.player.id));
 if(missed[0])awards.push({id:'away',title:'The One Who Got Away',emoji:'💨',player:missed[0].player,receipt:`Sold ${missed[0].trade.quantity} shares ${Math.floor(missed[0].rally.timestamp-missed[0].trade.time)}s before a +${missed[0].rally.analysis.suggestedPercentChange}% rally`});
 const profitable=[...players].filter(p=>p.realized>0).sort((a,b)=>b.realized-a.realized||a.id.localeCompare(b.id))[0];
 if(profitable)awards.push({id:'heartbreaker',title:'Certified Heartbreaker',emoji:'💅',player:profitable,receipt:`$${(profitable.realized/100).toFixed(2)} realized profit after fees`});
 const losses=players.map(player=>({player,loss:(portfolio(player,game.stocks).netWorth-1000000)/10000})).filter(p=>p.loss<0).sort((a,b)=>a.loss-b.loss||a.player.id.localeCompare(b.player.id));
 if(losses[0])awards.push({id:'damage',title:'Emotional Damage Champion',emoji:'💔',player:losses[0].player,receipt:`${losses[0].loss.toFixed(2)}% actual portfolio return`});
 const active=players.filter(p=>p.trades.length>0).sort((a,b)=>a.trades.length-b.trades.length||a.id.localeCompare(b.id));
 if(active[0])awards.push({id:'grass',title:'Touch Grass Award',emoji:'🌱',player:active[0],receipt:`${active[0].trades.length} settled trades — fewest among active participants`});
 return awards;
}
