import { afterEach,beforeEach,describe,it,expect,vi } from 'vitest';
import { cleanup,fireEvent,render,screen,waitFor,within } from '@testing-library/react';
import App from '../src/App';
import { createGame, ingest } from '../src/engine/market';
import { saveGame, STORAGE_KEY } from '../src/services/storage';
vi.mock('../src/components/MarketChart',()=>({MarketChart:({stock}:{stock:{ticker:string}})=><div role="img" aria-label={`${stock.ticker} interactive price history`}/>,Sparkline:()=> <svg/>}));
beforeEach(()=>{localStorage.clear();vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
function enter(){render(<App/>);fireEvent.change(screen.getByLabelText('What should the group chat call you?'),{target:{value:'Test Trader'}});fireEvent.click(screen.getByRole('button',{name:/Enter the market/}));fireEvent.click(screen.getByRole('button',{name:'Dismiss notification'}));}
describe('local demo user flows',()=>{
 it('dismisses the fictional notification and accepts display name',()=>{render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Dismiss fictional notification'}));expect(screen.queryByText('Hey, can we talk?')).not.toBeInTheDocument();fireEvent.change(screen.getByLabelText('What should the group chat call you?'),{target:{value:'Alex'}});fireEvent.click(screen.getByRole('button',{name:/Enter the market/}));expect(screen.getByText('Alex')).toBeInTheDocument();expect(screen.getByText('DEMO MODE')).toBeInTheDocument();});
 it('opens market, buys, sells and persists the settled wallet',async()=>{enter();fireEvent.click(screen.getByRole('button',{name:'Start or resume market'}));fireEvent.click(screen.getByRole('button',{name:'Buy TOXIC'}));await waitFor(()=>expect(screen.getByText(/Bought 5 TOXIC/)).toBeInTheDocument());expect(JSON.parse(localStorage.getItem('exchange-game-v1')!).player.cash).toBe(949750);fireEvent.click(screen.getByRole('button',{name:'Sell'}));fireEvent.click(screen.getByRole('button',{name:'Sell TOXIC'}));expect(JSON.parse(localStorage.getItem('exchange-game-v1')!).player.cash).toBe(999500);expect(JSON.parse(localStorage.getItem('exchange-game-v1')!).player.trades).toHaveLength(2);});
 it('runs the message-to-analysis-to-target-price pipeline',async()=>{enter();fireEvent.click(screen.getByRole('button',{name:'Start or resume market'}));fireEvent.click(within(document.querySelector('.sidebar') as HTMLElement).getByRole('button',{name:/DM inbox/}));fireEvent.click(screen.getByText('Presenter controls',{selector:'summary'}));fireEvent.click(screen.getByRole('button',{name:'Send Instagram event'}));await waitFor(()=>expect(screen.getByText('+25% event impact')).toBeInTheDocument());const game=JSON.parse(localStorage.getItem('exchange-game-v1')!);expect(game.stocks[0].target).toBe(12500);expect(game.events[0].analysis.method).toBe('rules');});
 it('mobile navigation opens portfolio and news',()=>{enter();const nav=document.querySelector('.mobile-nav')!;fireEvent.click(within(nav as HTMLElement).getByRole('button',{name:'My portfolio'}));expect(screen.getByText('Your emotional baggage')).toBeInTheDocument();fireEvent.click(within(nav as HTMLElement).getByRole('button',{name:'The tea'}));expect(screen.getByText('The market wire')).toBeInTheDocument();});
 it('refresh restores holdings and balance',()=>{enter();fireEvent.click(screen.getByRole('button',{name:'Start or resume market'}));fireEvent.click(screen.getByRole('button',{name:'Buy TOXIC'}));cleanup();render(<App/>);expect(screen.getByText('5 shares')).toBeInTheDocument();expect(JSON.parse(localStorage.getItem('exchange-game-v1')!).player.cash).toBe(949750);});
 it('final bell displays calculated results',()=>{enter();fireEvent.click(screen.getByRole('button',{name:'Start or resume market'}));fireEvent.click(screen.getByRole('button',{name:'Settings'}));fireEvent.click(screen.getByRole('button',{name:/Ring the final bell/}));expect(screen.getByRole('dialog')).toBeInTheDocument();expect(screen.getByText('THE FINAL BELL')).toBeInTheDocument();expect(screen.getByText(/total P&L .* Rank/)).toBeInTheDocument();});
 it('rapid repeated clicks settle only one purchase',()=>{enter();fireEvent.click(screen.getByRole('button',{name:'Start or resume market'}));const buy=screen.getByRole('button',{name:'Buy TOXIC'});fireEvent.click(buy);fireEvent.click(buy);const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)!);expect(saved.player.trades).toHaveLength(1);expect(saved.player.holdings.toxic.quantity).toBe(5);expect(saved.player.cash).toBe(949750);});
 it('recovery dialog offers peace and a normal one-share confirmation',()=>{
  let g=ingest({...createGame(),status:'running'},{id:'crash',stockId:'toxic',source:'simulated',type:'message',text:'They sent the same message to three other people.'});
  g=ingest({...g,elapsed:12},{id:'dog',stockId:'toxic',source:'simulated',type:'message',text:'They meant their dog.'});
  saveGame(g);localStorage.setItem('exchange-entered','true');render(<App/>);
  fireEvent.click(screen.getByRole('button',{name:/I CAN FIX THEM/}));fireEvent.click(screen.getByRole('button',{name:'I CHOOSE PEACE.'}));expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).player.trades).toHaveLength(0);
  fireEvent.click(screen.getByRole('button',{name:/I CAN FIX THEM/}));fireEvent.click(screen.getByRole('button',{name:/YES. THEY/}));fireEvent.click(screen.getByRole('button',{name:/Confirm buy/}));
  const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)!);expect(saved.player.cash).toBe(995176);expect(saved.player.holdings.toxic.quantity).toBe(1);expect(saved.player.delusion).toBe(25);expect(screen.getByRole('progressbar',{name:'Delusion Meter'})).toHaveAttribute('aria-valuenow','25');expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 });
 it('healing announcement preserves investments and appears once across refresh',()=>{
  const g=createGame();g.player.cash=90000;saveGame(g);localStorage.setItem('exchange-entered','true');render(<App/>);
  expect(screen.getByText('EMOTIONAL BANKRUPTCY ACHIEVED.')).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'BACK TO MAKING BAD DECISIONS'}));expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).player.cash).toBe(90000);cleanup();render(<App/>);expect(screen.queryByText('EMOTIONAL BANKRUPTCY ACHIEVED.')).not.toBeInTheDocument();expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).player.bankruptcySeen).toBe(true);
 });
 it('Hall of Shame is distinct from net-worth rankings and starts without invented awards',()=>{enter();fireEvent.click(within(document.querySelector('.sidebar') as HTMLElement).getByRole('button',{name:'Leaderboard'}));expect(screen.getByText('THE HALL OF SHAME')).toBeInTheDocument();expect(screen.getByText(/No qualifying receipts yet/)).toBeInTheDocument();});
 it('a cooldown rejection is shown without crashing or applying a second event',async()=>{
  const g=ingest({...createGame(),status:'running'},{id:'first-block',stockId:'toxic',source:'simulated',type:'block',text:'Blocked.'});saveGame(g);localStorage.setItem('exchange-entered','true');render(<App/>);
  fireEvent.click(within(document.querySelector('.sidebar') as HTMLElement).getByRole('button',{name:/DM inbox/}));fireEvent.click(screen.getByText('Presenter controls',{selector:'summary'}));
  fireEvent.change(screen.getByLabelText('Your fictional message'),{target:{value:'Your ex posts a new partner.'}});fireEvent.click(screen.getByRole('button',{name:'Send Instagram event'}));
  await waitFor(()=>expect(screen.getByText(/Major events on this stock need 12/)).toBeInTheDocument());expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).events).toHaveLength(1);expect(screen.getByRole('button',{name:'Send Instagram event'})).toBeEnabled();
 });
});


