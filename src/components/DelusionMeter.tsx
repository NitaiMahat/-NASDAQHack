import { Flame, Sparkles } from 'lucide-react';
import type { Player } from '../types';
import { delusionLevel } from '../engine/delusion';
export function DelusionMeter({player}:{player:Player}){
 const level=delusionLevel(player.delusion);
 return <section className={`panel delusion-panel ${player.delusion===100?'final-boss':''}`}><div className="panel-title"><h2><Flame size={17} className="pink"/> Delusion Meter</h2><span className="badge purple">YOU, NOT THE STOCK</span></div><div className="delusion-reading"><strong>{player.delusion}<small>/100</small></strong><span>{level.title}</span></div><div className="delusion-track" role="progressbar" aria-label="Delusion Meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={player.delusion}><i style={{width:`${player.delusion}%`}}/></div><p>{level.message}</p>{player.finalBossAchieved&&<div className="delusion-achievement"><Sparkles size={14}/> Achievement unlocked: Final Boss of Delusion</div>}<small className="tiny-note">Based on your actual trades. Fictional gameplay, not psychology.</small></section>;
}
