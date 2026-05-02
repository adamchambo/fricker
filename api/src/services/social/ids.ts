export function friendshipId(a: string, b: string): string {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

export function friendRequestDocId(fromUid: string, toUid: string): string {
  return `${fromUid}_${toUid}`;
}

export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@/, "").toLowerCase();
}
