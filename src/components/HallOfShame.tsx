import { Flame } from 'lucide-react';
import { shameAwards } from '../engine/awards';
import type { Game } from '../types';
export function HallOfShame({game}:{game:Game}){
 const awards=shameAwards(game);
 return <section className="panel hall-of-shame"><div className="panel-title"><h2><Flame size={18} className="pink"/> THE HALL OF SHAME</h2><span className="badge purple">RECEIPTS REQUIRED</span></div><p className="subtext">The normal leaderboard measures your money. This one measures the plot. Ties use player ID.</p>{awards.length?<div className="shame-grid">{awards.map(a=><article key={a.id} className="shame-award"><span className="award-emoji">{a.emoji}</span><div><span className="eyebrow">{a.title}</span><h3>{a.player.avatar} {a.player.name}{a.player.id==='local'?' (you)':''}</h3><p>{a.receipt}</p><small>{a.player.id==='local'?'Your actual game activity':'Simulated competitor · actual game activity'}</small></div></article>)}</div>:<div className="empty-state">No qualifying receipts yet. Awards appear only when someone earns them.</div>}</section>;
}
