import type { HangoutHistoryCreate } from "../schemas/history.js";
import type { HangoutPrefsFields } from "../schemas/hangoutPrefs.js";
import type { SavedSuggestionCreate } from "../schemas/savedSuggestion.js";
import type { UsersPublicDoc } from "../schemas/usersPublic.js";
import { friendshipId } from "../services/social/ids.js";
import {
  MOCK_FRIEND_FIXTURES,
  defaultViewerPrefs,
  defaultViewerPublic,
} from "./fixtures.js";
import { seedDemoInboxInviteForViewer } from "./mock-invites-store.js";
import { MOCK_UIDS } from "./uids.js";

const T0 = "2025-01-15T12:00:00.000Z";

type HistoryRow = HangoutHistoryCreate & { id: string; createdAt: string };
type SavedRow = SavedSuggestionCreate & { id: string; createdAt: string };

type FriendRequestRow = {
  id: string;
  fromUid: string;
  toUid: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  updatedAt: string;
};

export type MockSession = {
  viewerUid: string;
  /** All profiles visible in this session (viewer + seeded friends + any added). */
  profiles: Map<string, { public: UsersPublicDoc; prefs: HangoutPrefsFields }>;
  usernameToUid: Map<string, string>;
  friendOrder: string[];
  friendships: Set<string>;
  history: HistoryRow[];
  saved: SavedRow[];
  friendRequests: FriendRequestRow[];
};

const sessions = new Map<string, MockSession>();

function cloneProfile(p: UsersPublicDoc): UsersPublicDoc {
  return { ...p };
}

function clonePrefs(p: HangoutPrefsFields): HangoutPrefsFields {
  return { ...p, tags: [...p.tags] };
}

function seedSession(viewerUid: string): MockSession {
  const profiles = new Map<string, { public: UsersPublicDoc; prefs: HangoutPrefsFields }>();

  profiles.set(viewerUid, {
    public: cloneProfile(defaultViewerPublic(viewerUid)),
    prefs: clonePrefs(defaultViewerPrefs()),
  });

  for (const uid of Object.values(MOCK_UIDS)) {
    const fx = MOCK_FRIEND_FIXTURES[uid];
    if (!fx) continue;
    profiles.set(uid, {
      public: cloneProfile(fx.public as UsersPublicDoc),
      prefs: clonePrefs(fx.prefs),
    });
  }

  const usernameToUid = new Map<string, string>();
  for (const [uid, row] of profiles) {
    usernameToUid.set(row.public.usernameLower, uid);
  }

  const friendOrder = [MOCK_UIDS.sam, MOCK_UIDS.jordan];
  const friendships = new Set<string>();
  for (const other of friendOrder) {
    friendships.add(friendshipId(viewerUid, other));
  }
  friendships.add(friendshipId(MOCK_UIDS.sam, MOCK_UIDS.jordan));

  const history: HistoryRow[] = [
    {
      id: "mock-hist-1",
      friendId: MOCK_UIDS.sam,
      friendName: "Sam Rivera",
      activity: "Coffee at Northside Roasters",
      date: "2025-01-10T18:30:00.000Z",
      notes: "Caught up on holiday travel.",
      rating: 5,
      createdAt: T0,
    },
  ];

  const saved: SavedRow[] = [
    {
      id: "mock-saved-1",
      friendId: MOCK_UIDS.jordan,
      title: "Climbing gym + ramen after",
      reason: "Mock saved idea — combines your climbing + food prefs.",
      estimatedCost: "$$",
      estimatedDuration: "3 hours",
      nearbyPlaces: ["West end gym strip", "Ramen row"],
      inviteText: "",
      createdAt: T0,
    },
  ];

  const session: MockSession = {
    viewerUid,
    profiles,
    usernameToUid,
    friendOrder,
    friendships,
    history,
    saved,
    friendRequests: [],
  };

  sessions.set(viewerUid, session);
  seedDemoInboxInviteForViewer(viewerUid, friendships);
  return session;
}

export function ensureMockSession(viewerUid: string): MockSession {
  const existing = sessions.get(viewerUid);
  if (existing) return existing;
  return seedSession(viewerUid);
}
