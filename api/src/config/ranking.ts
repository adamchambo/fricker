/**
 * Ranking policy (social pivot):
 * - Friend list order is primarily manual via `sortRank` on each user's `friendEdges/{otherUid}`.
 * - After a hangout invite is **accepted**, both users' edges are appended to the bottom of their own
 *   friend ordering (max sortRank + 1). This matches "they accepted → sink toward bottom" without
 *   affecting unrelated friendships.
 * - `lastAcceptedInviteAt` is stored for optional UI badges / future suggestion-stack tuning.
 */
export const INVITE_ACCEPT_SORT_APPEND = true;

/** ISO timestamps on edges for analytics / future suggestion deprioritization. */
export const TRACK_LAST_ACCEPTED_ON_EDGE = true;
