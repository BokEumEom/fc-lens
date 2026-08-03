// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useApiKey } from './useApiKey';
import * as api from '../lib/api/nexon';

const KEY_STORAGE = 'fconline_nexon_api_key';

describe('useApiKey', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('저장된 키로 초기화한다', () => {
    localStorage.setItem(KEY_STORAGE, 'saved_key');
    const { result } = renderHook(() => useApiKey());

    expect(result.current.savedKey).toBe('saved_key');
    expect(result.current.draftKey).toBe('saved_key');
  });

  it('검증에 성공하면 저장한다', async () => {
    vi.spyOn(api, 'verifyKey').mockResolvedValue({ valid: true });
    const { result } = renderHook(() => useApiKey());

    act(() => result.current.setDraftKey('good_key'));
    await act(async () => {
      await expect(result.current.save()).resolves.toBe(true);
    });

    expect(result.current.savedKey).toBe('good_key');
    expect(localStorage.getItem(KEY_STORAGE)).toBe('good_key');
    expect(result.current.statusMessage).toContain('저장');
  });

  it('검증에 실패하면 저장하지 않는다', async () => {
    vi.spyOn(api, 'verifyKey').mockResolvedValue({ valid: false, error: 'Invalid key' });
    const { result } = renderHook(() => useApiKey());

    act(() => result.current.setDraftKey('bad_key'));
    await act(async () => {
      await expect(result.current.save()).resolves.toBe(false);
    });

    expect(result.current.savedKey).toBe('');
    expect(localStorage.getItem(KEY_STORAGE)).toBeNull();
    expect(result.current.statusMessage).toContain('Invalid key');
  });

  it('빈 값을 저장하면 검증 없이 키를 해제한다', async () => {
    const verify = vi.spyOn(api, 'verifyKey');
    localStorage.setItem(KEY_STORAGE, 'old_key');
    const { result } = renderHook(() => useApiKey());

    act(() => result.current.setDraftKey(''));
    await act(async () => {
      await expect(result.current.save()).resolves.toBe(true);
    });

    expect(verify).not.toHaveBeenCalled();
    expect(result.current.savedKey).toBe('');
    expect(localStorage.getItem(KEY_STORAGE)).toBeNull();
  });

  it('네트워크 오류를 사용자 메시지로 노출한다', async () => {
    vi.spyOn(api, 'verifyKey').mockRejectedValue(new Error('네트워크 실패'));
    const { result } = renderHook(() => useApiKey());

    act(() => result.current.setDraftKey('k'));
    await act(async () => {
      await expect(result.current.save()).resolves.toBe(false);
    });

    expect(result.current.statusMessage).toContain('네트워크 실패');
    expect(result.current.validating).toBe(false);
  });

  it('모달을 열면 이전 상태 메시지를 지운다', async () => {
    vi.spyOn(api, 'verifyKey').mockResolvedValue({ valid: false, error: 'nope' });
    const { result } = renderHook(() => useApiKey());

    act(() => result.current.setDraftKey('k'));
    await act(async () => {
      await result.current.save();
    });
    await waitFor(() => expect(result.current.statusMessage).not.toBeNull());

    act(() => result.current.openModal());

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.statusMessage).toBeNull();
  });
});
