// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useToast } from './useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('초기에는 메시지가 없다', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.message).toBeNull();
  });

  it('메시지를 보여주고 시간이 지나면 지운다', () => {
    const { result } = renderHook(() => useToast(1000));

    act(() => result.current.show('복사했습니다'));
    expect(result.current.message).toBe('복사했습니다');

    act(() => vi.advanceTimersByTime(999));
    expect(result.current.message).toBe('복사했습니다');

    act(() => vi.advanceTimersByTime(1));
    expect(result.current.message).toBeNull();
  });

  it('연속 호출 시 타이머를 초기화해 마지막 메시지가 온전히 표시된다', () => {
    const { result } = renderHook(() => useToast(1000));

    act(() => result.current.show('첫번째'));
    act(() => vi.advanceTimersByTime(800));
    act(() => result.current.show('두번째'));

    // 첫 타이머가 남아 있으면 200ms 뒤에 지워져 버린다
    act(() => vi.advanceTimersByTime(800));
    expect(result.current.message).toBe('두번째');

    act(() => vi.advanceTimersByTime(200));
    expect(result.current.message).toBeNull();
  });

  it('언마운트 시 타이머를 정리한다', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
    const { result, unmount } = renderHook(() => useToast(1000));

    act(() => result.current.show('메시지'));
    unmount();

    expect(clearSpy).toHaveBeenCalled();
  });
});
