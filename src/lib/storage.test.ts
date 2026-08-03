// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getLastOwner, setLastOwner } from './storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('마지막 구단주를 저장하고 읽는다', () => {
    expect(getLastOwner()).toBe('');

    setLastOwner('두치와뿌꾸');
    expect(getLastOwner()).toBe('두치와뿌꾸');
  });

  it('앞뒤 공백을 제거한다', () => {
    setLastOwner('  구단주  ');
    expect(getLastOwner()).toBe('구단주');
  });

  it('빈 값을 저장하면 항목을 제거한다', () => {
    setLastOwner('구단주');
    setLastOwner('');
    expect(getLastOwner()).toBe('');
    expect(localStorage.getItem('fclens_last_owner')).toBeNull();
  });

  it('저장소 접근이 막혀도 예외를 던지지 않는다', () => {
    // 사파리 프라이빗 모드 등에서 localStorage가 throw할 수 있다
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => setLastOwner('구단주')).not.toThrow();
    expect(getLastOwner()).toBe('');
    expect(errorSpy).toHaveBeenCalled();
  });
});
