import React from 'react';
import type { ApiKeyState } from '../../hooks/useApiKey';

const NEXON_PORTAL_URL = 'https://openapi.nexon.com/ko/game/fconline/?id=2';

interface ApiKeyModalProps {
  apiKey: ApiKeyState;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ apiKey }) => {
  if (!apiKey.isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#161A1E] border border-[#2D333B] w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-[#2D333B] pb-3">
          <div>
            <h3 className="text-base font-bold text-white font-headline">넥슨 Open API 키</h3>
            <p className="text-xs text-[#C3CAAC]">
              키를 비워두면 서버에 설정된 키를 사용합니다
            </p>
          </div>
          <button
            onClick={apiKey.closeModal}
            aria-label="닫기"
            className="text-[#C3CAAC] hover:text-white p-1 rounded-lg"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-2 text-xs text-[#C3CAAC]">
          <p>
            키 발급:{' '}
            <a
              href={NEXON_PORTAL_URL}
              target="_blank"
              rel="noreferrer"
              className="text-[#B9F600] underline font-bold"
            >
              넥슨 Open API 개발자 포털
            </a>
          </p>

          <input
            type="password"
            value={apiKey.draftKey}
            onChange={(e) => apiKey.setDraftKey(e.target.value)}
            placeholder="test_nxapi_... 키를 붙여넣으세요"
            className="w-full bg-[#232B34] border border-[#2D333B] rounded-xl p-2.5 text-white text-xs font-mono placeholder-[#C3CAAC]/50 focus:outline-none focus:ring-2 focus:ring-[#B9F600]"
          />

          {apiKey.statusMessage && (
            <div className="p-2 bg-[#182029] rounded-lg font-data text-xs text-white">
              {apiKey.statusMessage}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#2D333B]">
          <button
            onClick={apiKey.closeModal}
            className="px-3.5 py-2 bg-[#232B34] text-[#C3CAAC] hover:text-white font-data text-xs rounded-xl"
          >
            취소
          </button>
          <button
            onClick={() => {
              void apiKey.save().then((ok) => {
                if (ok) setTimeout(apiKey.closeModal, 1000);
              });
            }}
            disabled={apiKey.validating}
            className="px-4 py-2 bg-[#B9F600] text-[#141F00] font-data font-bold text-xs rounded-xl hover:brightness-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1"
          >
            {apiKey.validating ? (
              <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
            ) : (
              <span>검증 후 저장</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
