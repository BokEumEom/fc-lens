// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApiKeyModal } from './ApiKeyModal';
import type { ApiKeyState } from '../../hooks/useApiKey';

function makeApiKey(overrides: Partial<ApiKeyState> = {}): ApiKeyState {
  return {
    draftKey: '',
    setDraftKey: vi.fn(),
    savedKey: '',
    isModalOpen: true,
    openModal: vi.fn(),
    closeModal: vi.fn(),
    validating: false,
    statusMessage: null,
    save: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

describe('ApiKeyModal', () => {
  it('닫힌 상태에서는 아무것도 그리지 않는다', () => {
    const { container } = render(<ApiKeyModal apiKey={makeApiKey({ isModalOpen: false })} />);
    expect(container.firstChild).toBeNull();
  });

  it('키를 화면에 노출하지 않도록 password 입력을 쓴다', () => {
    const { container } = render(<ApiKeyModal apiKey={makeApiKey({ draftKey: 'secret' })} />);

    const input = container.querySelector('input')!;
    expect(input.getAttribute('type')).toBe('password');
    expect(input.value).toBe('secret');
  });

  it('입력하면 draft 키를 갱신한다', () => {
    const setDraftKey = vi.fn();
    const { container } = render(<ApiKeyModal apiKey={makeApiKey({ setDraftKey })} />);

    fireEvent.change(container.querySelector('input')!, { target: { value: 'new_key' } });

    expect(setDraftKey).toHaveBeenCalledWith('new_key');
  });

  it('저장 버튼이 save를 호출한다', async () => {
    const save = vi.fn().mockResolvedValue(true);
    render(<ApiKeyModal apiKey={makeApiKey({ save })} />);

    fireEvent.click(screen.getByText('검증 후 저장'));

    await waitFor(() => expect(save).toHaveBeenCalled());
  });

  it('취소와 닫기 버튼이 모달을 닫는다', () => {
    const closeModal = vi.fn();
    render(<ApiKeyModal apiKey={makeApiKey({ closeModal })} />);

    fireEvent.click(screen.getByText('취소'));
    fireEvent.click(screen.getByLabelText('닫기'));

    expect(closeModal).toHaveBeenCalledTimes(2);
  });

  it('검증 중에는 저장 버튼을 비활성화한다', () => {
    render(<ApiKeyModal apiKey={makeApiKey({ validating: true })} />);

    expect(screen.queryByText('검증 후 저장')).toBeNull();
    const button = document.querySelector('button[disabled]');
    expect(button).not.toBeNull();
  });

  it('상태 메시지를 그대로 보여준다', () => {
    render(<ApiKeyModal apiKey={makeApiKey({ statusMessage: '❌ 유효하지 않은 키입니다' })} />);
    expect(screen.getByText('❌ 유효하지 않은 키입니다')).toBeDefined();
  });

  it('키 발급 포털 링크를 제공한다', () => {
    render(<ApiKeyModal apiKey={makeApiKey()} />);

    const link = screen.getByText('넥슨 Open API 개발자 포털') as HTMLAnchorElement;
    expect(link.href).toContain('openapi.nexon.com');
    expect(link.rel).toContain('noreferrer');
  });
});
