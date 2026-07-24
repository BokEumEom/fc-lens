import { getAccount } from "../lib/api/nexon";
import type { AccountResponse } from "../lib/api/types";
import { useAsync, type AsyncState } from "./useAsync";

// 구단주 계정 정보 조회 (nickname 이 있을 때만 실행)
export function useAccount(nickname: string): AsyncState<AccountResponse> {
  return useAsync<AccountResponse>(
    () => getAccount(nickname),
    [nickname],
    Boolean(nickname.trim())
  );
}
