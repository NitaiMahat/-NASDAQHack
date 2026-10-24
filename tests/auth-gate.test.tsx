import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthGate } from '../src/components/AuthGate';
import { getSession } from '../src/services/auth';
vi.mock('../src/App',()=>({default:({account}:{account?:{alias:string}})=><div>{account?`Account: ${account.alias}`:'Guest trading floor'}</div>}));
vi.mock('../src/services/auth',async importOriginal=>({...await importOriginal<typeof import('../src/services/auth')>(),getSession:vi.fn()}));
const account={id:'a',email:'demo@example.test',alias:'Demo Trader',balance:10000,createdAt:'2026-01-01'};
beforeEach(()=>{history.replaceState(null,'','/');vi.mocked(getSession).mockReset();});
afterEach(()=>{cleanup();history.replaceState(null,'','/');});
describe('session gate and guest compatibility',()=>{
 it('opens the trading floor for a validated account',async()=>{vi.mocked(getSession).mockResolvedValue({status:'authenticated',account});render(<AuthGate navigate={vi.fn()}/>);expect(await screen.findByText('Account: Demo Trader')).toBeInTheDocument();});
 it('redirects an anonymous session to the built login page',async()=>{const navigate=vi.fn();vi.mocked(getSession).mockResolvedValue({status:'anonymous'});render(<AuthGate navigate={navigate}/>);await waitFor(()=>expect(navigate).toHaveBeenCalledWith('/login.html'));expect(navigate).toHaveBeenCalledTimes(1);});
 it('does not loop redirects when the API is unavailable',async()=>{const navigate=vi.fn();vi.mocked(getSession).mockResolvedValue({status:'unavailable'});render(<AuthGate navigate={navigate}/>);expect(await screen.findByText('The account service is unavailable.')).toBeInTheDocument();expect(navigate).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('link',{name:/Continue as guest/}));expect(screen.getByText('Guest trading floor')).toBeInTheDocument();expect(location.search).toBe('?demo=1');});
 it('runs an explicit guest demo without an auth server',()=>{history.replaceState(null,'','/?demo=1');render(<AuthGate navigate={vi.fn()}/>);expect(screen.getByText('Guest trading floor')).toBeInTheDocument();expect(getSession).not.toHaveBeenCalled();});
 it('retries a failed session without discarding the option to play',async()=>{vi.mocked(getSession).mockResolvedValueOnce({status:'unavailable'}).mockResolvedValueOnce({status:'authenticated',account});render(<AuthGate navigate={vi.fn()}/>);fireEvent.click(await screen.findByRole('button',{name:'Retry account service'}));expect(await screen.findByText('Account: Demo Trader')).toBeInTheDocument();});
});
