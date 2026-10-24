import type { MarketEvent } from '../types';
export interface EventRule {id:string;text:string;type:MarketEvent['type'];impact:number;headline:string;roast:string;keywords:string[];status?:string}
export const EVENT_RULES:EventRule[]=[
 {id:'comeback-like',text:'Your ex likes your comeback story.',type:'like',impact:10,headline:'The comeback gets a public endorsement.',roast:'Ten percent optimism. Ninety percent unresolved history.',keywords:['likes your comeback story']},
 {id:'comeback-hey',text:'Your ex sends “Hey”.',type:'message',impact:10,headline:'A three-letter message beats earnings expectations.',roast:'The group chat would like to see the full conversation.',keywords:['sends “hey”','sends "hey"']},
 {id:'crush-heart',text:'Your crush sends a heart emoji.',type:'message',impact:15,headline:'A heart from your crush pushes futures higher.',roast:'One emoji. Three imaginary anniversaries.',keywords:['crush sends a heart']},
 {id:'unblocked',text:'Your ex unblocks you.',type:'relationship_update',impact:15,headline:'Access restored. Common sense remains offline.',roast:'The unblock button is not a legally binding apology.',keywords:['unblocks','unblocked'],status:'Back in the inbox'},
 {id:'follows-again',text:'Your ex follows you again.',type:'relationship_update',impact:15,headline:'A follow-back ignites emotional futures.',roast:'One follower. Forty-seven unresolved issues.',keywords:['follows you again','followed you again','follows again']},
 {id:'story-like',text:'Your ex liked your story.',type:'like',impact:5,headline:'Your ex just liked your Instagram story.',roast:'A double tap is not a down payment on a future together.',keywords:['liked your story','likes your story','liked an old photo','liked my story']},
 {id:'everyone-story',text:'Turns out they liked everyone’s story.',type:'message',impact:-15,headline:'Turns out they liked everyone’s story.',roast:'Your exclusive signal was a public service announcement.',keywords:["liked everyone's story",'liked everyone’s story']},
 {id:'miss-you',text:'I miss you ❤️',type:'message',impact:25,headline:'Your ex just texted “I miss you.”',roast:'WE’RE SO BACK. Your due diligence was one heart emoji.',keywords:['miss you','miss us'],status:'False hope rising'},
 {id:'same-message',text:'They sent the same message to three other people.',type:'message',impact:-40,headline:'They sent the same message to three other people.',roast:'BRO GOT EMOTIONALLY LIQUIDATED.',keywords:['same message to three','same message to 3'],status:'Emotionally rug-pulled'},
 {id:'meant-dog',text:'They meant their dog.',type:'message',impact:-20,headline:'UPDATE: They meant their dog.',roast:'The only loyal participant in this narrative has four legs.',keywords:['meant their dog','meant her dog','meant his dog']},
 {id:'heart-reply',text:'Your ex replies with a heart.',type:'message',impact:10,headline:'A heart reply sparks a cautious rally.',roast:'Emoji-based valuation. What could possibly go wrong?',keywords:['replies with a heart','replied with a heart','heart emoji']},
 {id:'left-read',text:'Left on read.',type:'message',impact:-8,headline:'Read receipts confirm an emotional liquidity shortage.',roast:'Seen at 2:14. Your dignity left at 2:15.',keywords:['left on read','leaves you on read']},
 {id:'bro',text:'Your ex calls you “bro”.',type:'message',impact:-15,headline:'“Bro” sends romance futures into correction.',roast:'The relationship has been reclassified as a group project.',keywords:['calls you "bro"','calls you “bro”','calls you bro']},
 {id:'unfollowed',text:'Your ex unfollowed you.',type:'unfollow',impact:-20,headline:'An unfollow triggers an emotional sell-off.',roast:'You lost a follower and gained a leading indicator.',keywords:['unfollow'],status:'No longer following'},
 {id:'new-partner',text:'Your ex posts a new partner.',type:'relationship_update',impact:-30,headline:'A new partner enters the picture. Investors request closure.',roast:'The soft launch had a very hard landing.',keywords:['new partner','seeing someone else','soft launch'],status:'Someone else’s problem'},
 {id:'blocked',text:'Blocked.',type:'block',impact:-35,headline:'Access revoked. Emotional liquidity evaporates.',roast:'The only thing getting through is the transaction fee.',keywords:['blocked','blocks you'],status:'Blocked. Again.'},
 {id:'back-together',text:'I want you back. Let’s get back together.',type:'relationship_update',impact:30,headline:'A second chance powers a genuine comeback rally.',roast:'WE’RE SO BACK. The group chat remains skeptical.',keywords:['want you back','back together','make it official'],status:'Together, allegedly'},
 {id:'hoodie',text:'They only wanted their hoodie back.',type:'message',impact:-35,headline:'The reunion was a clothing collection service.',roast:'Your emotional comeback was a free returns policy.',keywords:['hoodie back']},
 {id:'meet-up',text:'They suggest meeting up.',type:'message',impact:15,headline:'Meeting plans send relationship futures higher.',roast:'A calendar invite has entered the valuation model.',keywords:['meeting up','meet up']},
 {id:'new-boyfriend',text:'They bring their new boyfriend.',type:'message',impact:-45,headline:'The reunion arrives with an unexpected plus-one.',roast:'Your recovery thesis brought its own exit liquidity.',keywords:['new boyfriend','new girlfriend']},
 {id:'instant-reply',text:'Your crush replies immediately.',type:'message',impact:10,headline:'An immediate reply beats analyst expectations.',roast:'Response times have become the new interest rates.',keywords:['replies immediately','replied immediately']},
 {id:'brother',text:'You’re like a brother to me.',type:'message',impact:-40,headline:'Romance downgraded to sibling status.',roast:'The friend zone has issued you a lifetime membership.',keywords:['brother to me','brother to them'],status:'Family-zoned'},
 {id:'talk',text:'We need to talk.',type:'message',impact:-10,headline:'Four words trigger a cautious sell-off.',roast:'Analysts are typing and deleting their resignation.',keywords:['need to talk']},
 {id:'wrong-person',text:'Wrong person, sorry.',type:'message',impact:-25,headline:'The plot twist was not priced in.',roast:'Diversification would have been cheaper than denial.',keywords:['wrong person']},
 {id:'lonely',text:'Sorry, I was just feeling lonely.',type:'message',impact:-18,headline:'The group chat downgrades the reconciliation thesis.',roast:'You were the notification, not the destination.',keywords:['lonely']},
 {id:'friends',text:'Can we still be friends?',type:'message',impact:8,headline:'A friendship clause fuels a cautious recovery.',roast:'The friend zone has surprisingly strong fundamentals.',keywords:['still be friends']},
 {id:'hey',text:'Hey, how have you been?',type:'message',impact:5,headline:'A greeting sparks cautious optimism.',roast:'A notification is not a wedding invitation. Allegedly.',keywords:['how have you','how are you','good morning','replied to your story']},
];
export const ruleById=(id:string)=>EVENT_RULES.find(rule=>rule.id===id);
export function matchRule(text:string,type='message'){
 const normalized=text.toLowerCase().replace(/’/g,"'");
 // Specific plot twists come before generic positive words such as "miss you".
 return EVENT_RULES.find(rule=>rule.keywords.some(word=>normalized.includes(word.toLowerCase().replace(/’/g,"'"))))
  ??(type==='block'?ruleById('blocked'):type==='unfollow'?ruleById('unfollowed'):type==='like'?ruleById('story-like'):undefined);
}
export const STORYLINES=[
 {id:'comeback',name:'The Comeback',description:'An unblock. A story like. A suspiciously specific reunion.',events:[{offset:0,ruleId:'unblocked'},{offset:15,ruleId:'comeback-like'},{offset:30,ruleId:'comeback-hey'},{offset:48,ruleId:'hoodie'}]},
 {id:'false-hope',name:'The False Hope',description:'They miss us. They want to meet. They bring a plus-one.',events:[{offset:0,ruleId:'miss-you'},{offset:18,ruleId:'meet-up'},{offset:38,ruleId:'new-boyfriend'}]},
 {id:'friend-zone',name:'The Friend Zone',description:'Fast replies, heart emojis, and a family reunion.',events:[{offset:0,ruleId:'instant-reply'},{offset:15,ruleId:'crush-heart'},{offset:35,ruleId:'brother'}]},
];
