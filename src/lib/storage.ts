// 브라우저 로컬 저장소 접근. 사파리 프라이빗 모드 등에서 예외가 날 수 있어 항상 감싼다.
// 넥슨 API 키는 요청 헤더 주입과 함께 다뤄야 하므로 lib/api/client.ts가 별도로 관리한다.

const LAST_OWNER_KEY = "fclens_last_owner";

function read(key: string): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function write(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    if (value.trim()) localStorage.setItem(key, value.trim());
    else localStorage.removeItem(key);
  } catch (err) {
    console.error(`로컬 저장소에 ${key}를 저장하지 못했습니다.`, err);
  }
}

/** 마지막으로 조회한 구단주 닉네임 (없으면 빈 문자열) */
export function getLastOwner(): string {
  return read(LAST_OWNER_KEY);
}

export function setLastOwner(nickname: string): void {
  write(LAST_OWNER_KEY, nickname);
}
