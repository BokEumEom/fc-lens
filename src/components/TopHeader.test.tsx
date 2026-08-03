// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TopHeader } from './TopHeader';

describe('TopHeader', () => {
  it('제목과 부제를 보여준다', () => {
    render(<TopHeader title="FC LENS" subtitle="OWNER ANALYSIS" />);

    expect(screen.getByText('FC LENS')).toBeDefined();
    expect(screen.getByText('OWNER ANALYSIS')).toBeDefined();
  });

  it('부제가 없으면 그리지 않는다', () => {
    render(<TopHeader title="FC LENS" />);
    expect(screen.queryByText('OWNER ANALYSIS')).toBeNull();
  });

  it('기본 제목은 FC LENS다', () => {
    render(<TopHeader />);
    expect(screen.getByText('FC LENS')).toBeDefined();
  });

  it('알림 목록은 클릭하기 전에는 닫혀 있다', () => {
    render(<TopHeader />);
    expect(screen.queryByText('Notifications')).toBeNull();
  });

  it('알림 버튼으로 목록을 열고 닫는다', () => {
    render(<TopHeader />);
    const button = screen.getByLabelText('Notifications');

    fireEvent.click(button);
    expect(screen.getByText('Notifications')).toBeDefined();

    fireEvent.click(button);
    expect(screen.queryByText('Notifications')).toBeNull();
  });

  it('모두 읽음을 누르면 읽지 않은 알림 표시가 사라진다', () => {
    render(<TopHeader />);
    fireEvent.click(screen.getByLabelText('Notifications'));

    expect(screen.getByText('Mark read')).toBeDefined();
    fireEvent.click(screen.getByText('Mark read'));

    expect(screen.queryByText('Mark read')).toBeNull();
  });
});
