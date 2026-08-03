// 테스트용 메타 테이블. 실제 정적 메타의 극히 일부만 담아 결정적으로 검증한다.
// 실제 값 예시: spid 866200145 = "카제미루", 시즌 866 = "26 TOTS", 매치타입 52 = "감독모드".

import type { MetaTables } from "../meta";

export const SPID_KNOWN = 866200145;
export const SPID_UNKNOWN = 999999999;
export const POSITION_KNOWN = 25;
export const SEASON_KNOWN = 866;
export const MATCHTYPE_KNOWN = 52;

export function makeMeta(overrides: Partial<MetaTables> = {}): MetaTables {
  return {
    playerNames: new Map([[SPID_KNOWN, "카제미루"]]),
    positions: new Map([
      [POSITION_KNOWN, "LM"],
      [28, "SUB"],
    ]),
    seasons: new Map([
      [
        SEASON_KNOWN,
        {
          seasonId: SEASON_KNOWN,
          className: "26 TOTS (26 Team Of The Season)",
          seasonImg: "https://example.test/season/866.png",
        },
      ],
    ]),
    matchTypes: new Map([[MATCHTYPE_KNOWN, "감독모드"]]),
    ...overrides,
  };
}
