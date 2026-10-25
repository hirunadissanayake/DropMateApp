// Remember closed requests for the response window so delayed pushes and fetch
// responses cannot reopen them. IDs are unique across accounts and requests.
const closedRequests = new Map<string, number>();
const listeners = new Set<(matchId: string) => void>();
const WINDOW_MS = 10 * 60_000;

export const isParcelRequestClosed = (matchId: string) => {
  const now = Date.now();
  for (const [id, closedAt] of closedRequests) {
    if (now - closedAt >= WINDOW_MS) closedRequests.delete(id);
  }
  return closedRequests.has(matchId);
};

export const rememberClosedParcelRequest = (matchId: string) => {
  if (!matchId) return;
  isParcelRequestClosed(matchId); // Prune expired entries.
  closedRequests.set(matchId, Date.now());
};

export const closeParcelRequest = (matchId: string) => {
  if (!matchId) return;
  rememberClosedParcelRequest(matchId);
  listeners.forEach(listener => listener(matchId));
};

export const subscribeParcelRequestClosed = (listener: (matchId: string) => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
