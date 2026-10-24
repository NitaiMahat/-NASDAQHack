import { afterEach, describe, expect, it, vi } from 'vitest';
import { currentAccount, getSession, logout } from '../src/services/auth';
afterEach(()=>vi.unstubAllGlobals());
describe('account service client',()=>{
 it('validates account responses before allowing entry',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>({account:{id:'a',email:'a@example.test',alias:'Trader',balance:10000,createdAt:'2026-01-01'}})}));expect(await currentAccount()).toMatchObject({id:'a',alias:'Trader'});});
 it('distinguishes an expired session from unavailable or malformed APIs',async()=>{const fetchMock=vi.fn().mockResolvedValueOnce({ok:false,status:401}).mockResolvedValueOnce({ok:false,status:500}).mockResolvedValueOnce({ok:true,status:200,json:async()=>({account:{id:'bad'}})});vi.stubGlobal('fetch',fetchMock);expect(await getSession()).toEqual({status:'anonymous'});expect(await getSession()).toEqual({status:'unavailable'});expect(await getSession()).toEqual({status:'unavailable'});});
 it('handles network timeouts with an unavailable state',async()=>{vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new DOMException('Timeout','TimeoutError')));expect(await getSession()).toEqual({status:'unavailable'});});
 it('only redirects on confirmed logout and keeps failure visible',async()=>{const navigate=vi.fn(),fetchMock=vi.fn().mockResolvedValueOnce({ok:false}).mockResolvedValueOnce({ok:true});vi.stubGlobal('fetch',fetchMock);await expect(logout(navigate)).rejects.toThrow('Could not sign out');expect(navigate).not.toHaveBeenCalled();await logout(navigate);expect(navigate).toHaveBeenCalledWith('/login.html#login');});
});
