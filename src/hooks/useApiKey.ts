import { useCallback, useState } from "react";
import { getStoredApiKey, setStoredApiKey } from "../lib/api/client";
import { verifyKey } from "../lib/api/nexon";

export interface ApiKeyState {
  /** 입력 중인 키 값 (저장 전) */
  draftKey: string;
  setDraftKey: (key: string) => void;
  /** 실제로 저장되어 요청에 실리는 키 */
  savedKey: string;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  validating: boolean;
  statusMessage: string | null;
  /** 검증 후 저장. 저장(또는 해제)에 성공하면 true. */
  save: () => Promise<boolean>;
}

// 넥슨 Open API 키의 입력·검증·저장을 관리한다.
// 저장된 키는 lib/api/client가 모든 요청 헤더에 자동으로 실어 보낸다.
// 키가 없으면 서버의 환경변수 키로 폴백된다.
export function useApiKey(): ApiKeyState {
  const [savedKey, setSavedKey] = useState<string>(() => getStoredApiKey());
  const [draftKey, setDraftKey] = useState<string>(savedKey);
  const [isModalOpen, setModalOpen] = useState(false);
  const [validating, setValidating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const openModal = useCallback(() => {
    setStatusMessage(null);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const save = useCallback(async (): Promise<boolean> => {
    const trimmed = draftKey.trim();

    if (!trimmed) {
      setStoredApiKey("");
      setSavedKey("");
      setStatusMessage("사용자 키를 해제했습니다. 서버 환경변수 키를 사용합니다.");
      return true;
    }

    setValidating(true);
    setStatusMessage(null);

    try {
      const result = await verifyKey(trimmed);

      if (!result.valid) {
        setStatusMessage(`❌ 유효하지 않은 키입니다: ${result.error ?? "키를 확인해주세요."}`);
        return false;
      }

      setStoredApiKey(trimmed);
      setSavedKey(trimmed);
      setStatusMessage("✅ 유효한 넥슨 Open API 키를 저장했습니다.");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "알 수 없는 오류";
      setStatusMessage(`❌ 검증 중 오류가 발생했습니다: ${message}`);
      return false;
    } finally {
      setValidating(false);
    }
  }, [draftKey]);

  return {
    draftKey,
    setDraftKey,
    savedKey,
    isModalOpen,
    openModal,
    closeModal,
    validating,
    statusMessage,
    save,
  };
}
