import { describe, expect, it } from 'vitest';
import {
  MAX_RANKER_STATS_PLAYERS,
  normalizeMatchDetail,
  normalizeRankerStats,
  normalizeResult,
  normalizeTrades,
  parsePlayersParam,
  summarizeMatches,
  toMatchSummary,
  toRate,
} from './transform';
import {
  MATCHTYPE_KNOWN,
  POSITION_KNOWN,
  SPID_KNOWN,
  SPID_UNKNOWN,
  makeMeta,
} from './__fixtures__/meta';

import rawMatchDetail from './__fixtures__/match-detail.json';
import rawTrades from './__fixtures__/trade.json';
import rawRankerStats from './__fixtures__/ranker-stats.json';
import owner from './__fixtures__/owner.json';

const meta = makeMeta();

describe('toRate', () => {
  it('성공률을 정수 퍼센트로 반환한다', () => {
    expect(toRate(9, 10)).toBe(90);
    expect(toRate(1, 3)).toBe(33);
  });

  it('시도가 없으면 0을 반환한다 (기본값을 지어내지 않는다)', () => {
    expect(toRate(0, 0)).toBe(0);
    expect(toRate(undefined, undefined)).toBe(0);
    expect(toRate(5, -1)).toBe(0);
  });
});

describe('normalizeResult', () => {
  it('한글·영문 표기를 모두 한글로 정규화한다', () => {
    expect(normalizeResult('승')).toBe('승');
    expect(normalizeResult('WIN')).toBe('승');
    expect(normalizeResult('패')).toBe('패');
    expect(normalizeResult('LOSE')).toBe('패');
  });

  it('알 수 없는 값은 무승부로 처리한다', () => {
    expect(normalizeResult(undefined)).toBe('무');
    expect(normalizeResult('알수없음')).toBe('무');
  });
});

describe('normalizeMatchDetail', () => {
  // 이 계약이 깨져 매치 탭이 빈 화면이었다. teams[] 형태를 반드시 유지해야 한다.
  it('넥슨 matchInfo[]를 teams[]로 변환한다', () => {
    const result = normalizeMatchDetail(rawMatchDetail, meta);

    expect(result).toHaveProperty('teams');
    expect(result).not.toHaveProperty('matchInfo');
    expect(result.teams).toHaveLength(2);
    expect(result.matchId).toBe(rawMatchDetail.matchId);
  });

  it('팀마다 화면이 쓰는 필드를 모두 채운다', () => {
    const [team] = normalizeMatchDetail(rawMatchDetail, meta).teams;

    expect(team).toMatchObject({
      ouid: expect.any(String),
      nickname: expect.any(String),
      result: expect.stringMatching(/^[승무패]$/),
      score: expect.any(Number),
      possession: expect.any(Number),
      totalShots: expect.any(Number),
      effectiveShots: expect.any(Number),
      passSuccessRate: expect.any(Number),
      tackleSuccessRate: expect.any(Number),
      controller: expect.any(String),
      averageRating: expect.any(Number),
    });
    expect(Array.isArray(team.squad)).toBe(true);
  });

  it('matchType을 메타의 사람이 읽는 이름으로 바꾼다', () => {
    // 원본은 숫자 코드(52)이고 화면에는 "감독모드"가 보여야 한다.
    expect(rawMatchDetail.matchType).toBe(MATCHTYPE_KNOWN);
    expect(normalizeMatchDetail(rawMatchDetail, meta).matchType).toBe('감독모드');
  });

  it('스쿼드 선수에 메타를 조인하고 ranker-stats와 같은 스탯 어휘를 채운다', () => {
    const raw = {
      matchType: MATCHTYPE_KNOWN,
      matchInfo: [
        {
          ouid: 'o1',
          nickname: '나',
          player: [
            {
              spId: SPID_KNOWN,
              spPosition: POSITION_KNOWN,
              spGrade: 5,
              status: { goal: 2, assist: 1, spRating: 8.3, passTry: 10, passSuccess: 9 },
            },
          ],
        },
      ],
    };

    const [player] = normalizeMatchDetail(raw, meta).teams[0].squad;

    expect(player.name).toBe('카제미루');
    expect(player.position).toBe('LM');
    expect(player.season).toBe('26 TOTS (26 Team Of The Season)');
    expect(player.grade).toBe(5);
    expect(player.rating).toBe(8.3);
    // 초상 URL은 spid가 아니라 시즌을 뗀 pid를 쓴다 (spid로 요청하면 403).
    expect(player.image).toContain(`/players/p${SPID_KNOWN % 1_000_000}.png`);
    expect(player.image).not.toContain(String(SPID_KNOWN));
    // ranker-stats 응답과 키가 일치해야 비교가 가능하다
    expect(player.stats).toEqual({
      shoot: 0,
      effectiveShoot: 0,
      goal: 2,
      assist: 1,
      dribbleTry: 0,
      dribbleSuccess: 0,
      passTry: 10,
      passSuccess: 9,
      block: 0,
      tackle: 0,
    });
  });

  it('메타에 없는 spid도 이름 자리를 비우지 않는다', () => {
    const raw = {
      matchInfo: [{ ouid: 'o1', player: [{ spId: SPID_UNKNOWN, spPosition: 1 }] }],
    };
    const [player] = normalizeMatchDetail(raw, meta).teams[0].squad;

    expect(player.name).toContain(String(SPID_UNKNOWN));
    expect(player.season).toBe('');
  });

  it('빈 응답에도 깨지지 않는다', () => {
    expect(normalizeMatchDetail({}, meta).teams).toEqual([]);
    expect(normalizeMatchDetail(null, meta).teams).toEqual([]);
  });
});

describe('toMatchSummary', () => {
  const ouid = (owner as { ouid: string }).ouid;

  it('구단주 관점으로 내 팀과 상대 팀을 구분한다', () => {
    const summary = toMatchSummary(rawMatchDetail, ouid, meta);
    const me = rawMatchDetail.matchInfo.find((i) => i.ouid === ouid)!;
    const opp = rawMatchDetail.matchInfo.find((i) => i.ouid !== ouid)!;

    expect(summary).not.toBeNull();
    expect(summary!.myGoals).toBe(me.shoot.goalTotal);
    expect(summary!.opponentGoals).toBe(opp.shoot.goalTotal);
    expect(summary!.opponentNickname).toBe(opp.nickname);
    expect(summary!.score).toBe(`${me.shoot.goalTotal} : ${opp.shoot.goalTotal}`);
  });

  it('ouid가 목록에 없으면 첫 팀을 기준으로 삼는다', () => {
    const summary = toMatchSummary(rawMatchDetail, 'unknown-ouid', meta);
    expect(summary!.opponentNickname).toBe(rawMatchDetail.matchInfo[1].nickname);
  });

  it('득점자 이름을 메타에서 조인한다 (원본은 spId 숫자만 제공)', () => {
    const raw = {
      matchInfo: [
        {
          ouid: 'me',
          player: [
            { spId: SPID_KNOWN, status: { goal: 2, spRating: 8.1 } },
            { spId: SPID_KNOWN, status: { goal: 0, spRating: 6.0 } },
          ],
        },
      ],
    };

    const scorers = toMatchSummary(raw, 'me', meta)!.myGoalScorers;

    expect(scorers).toHaveLength(1); // 무득점 선수는 제외
    expect(scorers[0]).toEqual({ name: '카제미루', goals: 2, rating: 8.1 });
  });

  it('matchInfo가 비면 null을 반환한다', () => {
    expect(toMatchSummary({ matchInfo: [] }, 'me', meta)).toBeNull();
    expect(toMatchSummary({}, 'me', meta)).toBeNull();
  });
});

describe('summarizeMatches', () => {
  const make = (result: string, myGoals = 1, possession = 50) =>
    ({ result, myGoals, possession }) as never;

  it('승/무/패와 평균 지표를 집계한다', () => {
    const summary = summarizeMatches([
      make('승', 3, 60),
      make('승', 1, 40),
      make('무', 2, 50),
      make('패', 0, 30),
    ]);

    expect(summary).toMatchObject({
      totalMatches: 4,
      wins: 2,
      draws: 1,
      losses: 1,
      winRate: '50.0%',
      avgGoals: '1.5',
      avgPossession: '45%',
    });
  });

  it('빈 목록에서 0으로 나누지 않는다', () => {
    expect(summarizeMatches([])).toMatchObject({
      totalMatches: 0,
      winRate: '0%',
      avgGoals: '0',
      avgPossession: '50%',
    });
  });
});

describe('normalizeTrades', () => {
  it('실제 거래 응답에 선수명·시즌·이미지를 조인한다', () => {
    const trades = normalizeTrades(rawTrades, meta);

    expect(trades).toHaveLength(rawTrades.length);
    trades.forEach((t) => {
      expect(t.name).toBeTruthy();
      expect(t.image).toContain(`/players/p${t.spid % 1_000_000}.png`);
      expect(typeof t.value).toBe('number');
    });
  });

  it('배열이 아니면 빈 목록을 돌려준다', () => {
    expect(normalizeTrades(null, meta)).toEqual([]);
    expect(normalizeTrades({ error: true }, meta)).toEqual([]);
  });
});

describe('parsePlayersParam', () => {
  // players 없이 넥슨에 넘기면 OPENAPI00004로 실패한다. 여기서 걸러야 한다.
  it('유효한 JSON 배열을 파싱한다', () => {
    expect(parsePlayersParam('[{"id":250102143,"po":25}]')).toEqual([
      { id: 250102143, po: 25 },
    ]);
  });

  it('숫자 문자열도 숫자로 변환한다', () => {
    expect(parsePlayersParam('[{"id":"1","po":"2"}]')).toEqual([{ id: 1, po: 2 }]);
  });

  it('유효하지 않은 입력은 null을 반환한다', () => {
    expect(parsePlayersParam(undefined)).toBeNull();
    expect(parsePlayersParam('')).toBeNull();
    expect(parsePlayersParam('   ')).toBeNull();
    expect(parsePlayersParam('not json')).toBeNull();
    expect(parsePlayersParam('[]')).toBeNull();
    expect(parsePlayersParam('{"id":1}')).toBeNull();
    expect(parsePlayersParam('[{"id":"abc","po":1}]')).toBeNull();
    expect(parsePlayersParam('[{"po":1}]')).toBeNull();
  });

  it('과도한 요청은 상한까지만 자른다', () => {
    const many = JSON.stringify(
      Array.from({ length: MAX_RANKER_STATS_PLAYERS + 20 }, (_, i) => ({ id: i + 1, po: 1 }))
    );
    expect(parsePlayersParam(many)).toHaveLength(MAX_RANKER_STATS_PLAYERS);
  });
});

describe('normalizeRankerStats', () => {
  it('실제 응답에 메타를 조인하고 status를 보존한다', () => {
    const stats = normalizeRankerStats(rawRankerStats, meta);

    expect(stats).toHaveLength(rawRankerStats.length);
    stats.forEach((s, i) => {
      expect(s.spid).toBe(rawRankerStats[i].spid);
      expect(s.spPosition).toBe(rawRankerStats[i].spPosition);
      expect(s.status).toEqual(rawRankerStats[i].status);
      expect(s.image).toContain(`/players/p${s.spid % 1_000_000}.png`);
    });
  });

  it('배열이 아니면 빈 목록을 돌려준다', () => {
    expect(normalizeRankerStats({ error: true }, meta)).toEqual([]);
  });
});

describe('match-detail ↔ ranker-stats 스탯 어휘 (계약)', () => {
  // 두 응답이 같은 키를 써야 랭커 벤치마크 비교가 성립한다.
  it('match-detail 스쿼드의 stats 키가 ranker-stats의 status에 모두 존재한다', () => {
    const [player] = normalizeMatchDetail(rawMatchDetail, meta).teams[0].squad;
    const rankerStatus = (rawRankerStats[0] as { status: Record<string, number> }).status;

    Object.keys(player.stats).forEach((key) => {
      expect(rankerStatus).toHaveProperty(key);
    });
  });
});
