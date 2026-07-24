import { useCallback, useEffect, useState } from "react";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface InternalState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// 비동기 조회를 로딩/에러/데이터 상태로 관리하는 제네릭 훅.
// enabled=false 이면 조회를 건너뛴다(예: 아직 검색어가 없을 때).
export function useAsync<T>(
  fn: () => Promise<T>,
  deps: ReadonlyArray<unknown>,
  enabled = true
): AsyncState<T> {
  const [state, setState] = useState<InternalState<T>>({
    data: null,
    loading: enabled,
    error: null,
  });
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fn()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
    // fn은 매 렌더 새로 생성되므로 deps로 재조회 시점을 제어한다.
  }, [...deps, enabled, nonce]);

  return { ...state, refetch };
}
