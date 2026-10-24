import { afterEach,it,expect,vi } from 'vitest';
import { cleanup,render,screen,waitFor } from '@testing-library/react';
import { MarketChart } from '../src/components/MarketChart';
import { createGame } from '../src/engine/market';
afterEach(()=>cleanup());
it('renders a real Recharts SVG price curve with accessible chart text',async()=>{
 vi.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockReturnValue({width:800,height:300,top:0,left:0,right:800,bottom:300,x:0,y:0,toJSON(){return {};}});
 const stock=createGame().stocks[0];
 const {container}=render(<MarketChart stock={stock} range="all" events={[]} onEvent={()=>{}}/>);
 expect(screen.getByRole('img',{name:'TOXIC interactive price history'})).toBeInTheDocument();
 await waitFor(()=>expect(container.querySelector('.recharts-area-curve')).toHaveAttribute('d'));
 expect(container.querySelectorAll('.recharts-cartesian-axis-tick').length).toBeGreaterThan(0);
});
