import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed top-20 right-4 z-50 bg-[#B9F600] text-[#141F00] font-data font-bold text-xs px-3.5 py-2 rounded-xl shadow-2xl flex items-center gap-1.5 animate-in slide-in-from-top-2"
    >
      <span className="material-symbols-outlined text-[16px]">check_circle</span>
      <span>{message}</span>
    </div>
  );
};
