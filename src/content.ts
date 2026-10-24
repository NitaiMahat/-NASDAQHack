import type { Stock } from './types';
import { EVENT_RULES } from './engine/eventCatalog';
export const STOCKS:Omit<Stock,'price'|'target'|'haltUntil'|'momentum'|'history'>[]=[
{id:'toxic',ticker:'TOXIC',name:'The Toxic Ex',description:'Breaks up every weekend. Comes back every Monday. A recurring subscription to chaos.',avatar:'💔',color:'#ed90b4',basePrice:10000,volatility:.013,toxicity:92,sentiment:-.25,status:'It’s complicated',risk:'extreme'},
{id:'situ',ticker:'SITU',name:'The Situationship',description:'Four months together. Still introducing you as a friend.',avatar:'🫠',color:'#f6c478',basePrice:7500,volatility:.009,toxicity:68,sentiment:-.1,status:'Just talking',risk:'high'},
{id:'gone',ticker:'GONE',name:'The One That Got Away',description:'The timing was wrong. Your buy thesis is an old playlist.',avatar:'🌙',color:'#c5a0f1',basePrice:12000,volatility:.007,toxicity:42,sentiment:.15,status:'What could have been',risk:'medium'},
{id:'flag',ticker:'FLAG',name:'The Walking Red Flag',description:'Forty-seven warnings. You called it a growth opportunity.',avatar:'🚩',color:'#efaa8d',basePrice:5000,volatility:.015,toxicity:97,sentiment:-.4,status:'A warning with legs',risk:'extreme'},
{id:'green',ticker:'GREEN',name:'The Healthy Relationship',description:'Communicates clearly, respects boundaries. Frankly, suspicious.',avatar:'🌱',color:'#a5d8a3',basePrice:15000,volatility:.004,toxicity:12,sentiment:.8,status:'Suspiciously healthy',risk:'low'}];
const presetIds=['miss-you','story-like','follows-again','heart-reply','left-read','bro','unfollowed','new-partner','blocked','back-together','same-message','meant-dog'];
export const PRESETS=presetIds.map(id=>{const rule=EVENT_RULES.find(r=>r.id===id)!;return [rule.text,rule.type] as const;});
export const JUDGE_SPEED=10;
export const JUDGE_REVISION=2;
export const SCENARIO=[
 {at:40,stockId:'toxic',ruleId:'story-view'},
 {at:60,stockId:'situ',ruleId:'haha'},
 {at:80,stockId:'green',ruleId:'healthy-check-in'},
 {at:100,stockId:'gone',ruleId:'nostalgic-text'},
 {at:120,stockId:'flag',ruleId:'trust-me'},
 {at:140,stockId:'toxic',ruleId:'miss-you'},
 {at:160,stockId:'situ',ruleId:'everyone-babe'},
 {at:180,stockId:'toxic',ruleId:'same-message'},
 {at:200,stockId:'toxic',ruleId:'meant-dog'},
 {at:220,stockId:'flag',ruleId:'blocked'},
 {at:240,stockId:'green',ruleId:'showed-up'},
 {at:260,stockId:'gone',ruleId:'closure-only'},
 {at:280,stockId:'toxic',ruleId:'back-together'},
];
const beginnings=['BREAKING','GROUP CHAT ALERT','FEDERAL EX WATCH','AFTER HOURS','EMOTIONAL FUTURES','MARKET DISPATCH','HOT TAKE','CLOSURE INDEX'];
const endings=['investors demand a receipt.','the group chat is pricing it in.','common sense has left the exchange.','analysts recommend touching grass.','screenshots are now a leading indicator.'];
export const HEADLINES=beginnings.flatMap(a=>endings.map(b=>`${a}: {ticker} moves; ${b}`));
