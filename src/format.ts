export const money=(cents:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(cents/100);
export const change=(value:number,base:number)=>(value-base)/base*100;
export const percent=(n:number)=>`${n>=0?'+':''}${n.toFixed(2)}%`;
export const clock=(seconds:number)=>`${Math.floor(seconds/60).toString().padStart(2,'0')}:${Math.floor(seconds%60).toString().padStart(2,'0')}`;
