import type { MarketEvent, Stock } from '../types';
const reveals=new Set(['same-message','meant-dog','everyone-story','new-boyfriend','hoodie']);
const activity=new Set(['story-view','still-no-reply','story-like','follows-again','unblocked','blocked','unfollowed','new-partner','left-read']);
export function messagePresentation(event:MarketEvent,stock:Stock){
 if(event.ruleId&&reveals.has(event.ruleId))return {sender:'The group chat',avatar:'👀',kind:'PLOT TWIST'};
 if(event.ruleId&&activity.has(event.ruleId)||event.type==='like'||event.type==='block'||event.type==='unfollow')return {sender:`${stock.name} · activity`,avatar:stock.avatar,kind:'ACTIVITY UPDATE'};
 return {sender:stock.name,avatar:stock.avatar,kind:'INCOMING DM'};
}
