import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_DURATION_MS = 2500;

export interface ToastState {
  message: string | null;
  show: (message: string) => void;
}

// 짧은 안내 메시지를 일정 시간 후 자동으로 지운다.
export function useToast(durationMs = DEFAULT_DURATION_MS): ToastState {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const show = useCallback(
    (next: string) => {
      clearTimer();
      setMessage(next);
      timerRef.current = setTimeout(() => setMessage(null), durationMs);
    },
    [durationMs]
  );

  useEffect(() => clearTimer, []);

  return { message, show };
}
