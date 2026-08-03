/**
 * 앱 하단 내비게이션 탭.
 * 넥슨 공식 Open API 도메인과 1:1 대응한다 (SPEC.md 참고).
 *
 * - owner  → /fconline/v1/user/basic, /user/maxdivision, /user/match
 * - match  → /fconline/v1/match-detail
 * - trade  → /fconline/v1/user/trade
 * - ranker → /fconline/v1/ranker-stats
 */
export type TabType = 'owner' | 'match' | 'trade' | 'ranker';
