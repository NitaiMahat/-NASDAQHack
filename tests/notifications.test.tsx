import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { useNotifications } from '../src/hooks/useNotifications';
afterEach(()=>{cleanup();vi.useRealTimers();});
describe('compact notification queue',()=>{
 it('shows one notification at a time, deduplicates queued text, and advances after four seconds',()=>{
  vi.useFakeTimers();const {result}=renderHook(()=>useNotifications());
  act(()=>{result.current.notify('Bought a share.');result.current.notify('A crash actually happened.','loss');result.current.notify('A crash actually happened.','loss');});
  expect(result.current.notice?.message).toBe('Bought a share.');expect(result.current.pending).toBe(1);
  act(()=>vi.advanceTimersByTime(4000));expect(result.current.notice?.message).toBe('A crash actually happened.');
  act(()=>result.current.dismiss());expect(result.current.notice).toBeUndefined();
 });
 it('rotates relevant roasts instead of repeating the last message',()=>{const {result}=renderHook(()=>useNotifications());const lines=Array.from({length:5},()=>result.current.roast('buy'));expect(new Set(lines).size).toBe(5);expect(result.current.roast('sell')).not.toBe(lines[0]);});
});
