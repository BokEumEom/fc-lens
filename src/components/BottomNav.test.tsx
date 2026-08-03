// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BottomNav } from './BottomNav';
import { Toast } from './common/Toast';

describe('BottomNav', () => {
  it('공식 API 도메인과 1:1 대응하는 4탭을 보여준다', () => {
    render(<BottomNav activeTab="owner" setActiveTab={vi.fn()} />);

    ['구단주', '매치', '이적', '랭킹'].forEach((label) => {
      expect(screen.getByText(label)).toBeDefined();
    });
    // 삭제된 목업 탭이 남아 있지 않은지 확인
    expect(screen.queryByText('선수 검색')).toBeNull();
    expect(screen.queryByText('스쿼드')).toBeNull();
  });

  it('탭을 누르면 해당 탭 키로 콜백한다', () => {
    const setActiveTab = vi.fn();
    render(<BottomNav activeTab="owner" setActiveTab={setActiveTab} />);

    fireEvent.click(screen.getByText('이적'));

    expect(setActiveTab).toHaveBeenCalledWith('trade');
  });

  it('활성 탭만 강조 스타일을 갖는다', () => {
    render(<BottomNav activeTab="match" setActiveTab={vi.fn()} />);

    const active = screen.getByText('매치').closest('button')!;
    const inactive = screen.getByText('랭킹').closest('button')!;

    expect(active.className).toContain('#B9F600');
    expect(inactive.className).not.toContain('border-[#B9F600]/40');
  });
});

describe('Toast', () => {
  it('메시지가 없으면 아무것도 그리지 않는다', () => {
    const { container } = render(<Toast message={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('메시지를 status 역할로 노출한다', () => {
    render(<Toast message="OUID를 복사했습니다." />);

    const toast = screen.getByRole('status');
    expect(toast.textContent).toContain('OUID를 복사했습니다.');
  });
});
