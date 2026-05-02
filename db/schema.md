# fricker Firestore schema

The Express API uses the **Firebase Admin SDK**. Social features use **top-level collections** and **`users/{uid}/friendEdges`**; the API enforces that callers only act as their authenticated `uid`.

## Social graph (canonical for “friends”)

Friendships are between **real accounts** (Firebase Auth UIDs), not local-only records.

### `friendships/{friendshipId}`

- `friendshipId`: sorted pair `uidSmall_uidLarge`
- `members`: string[] (two UIDs)
- `createdAt`: ISO string

### `users/{userId}/friendEdges/{counterpartyUid}`

Edge from viewer to each friend (ordering, metadata).

| Field | Type | Notes |
|-------|------|-------|
| friendshipId | string | matches `friendships` doc |
| counterpartyUid | string | other user |
| sortRank | number | display order |
| createdAt / updatedAt | string | ISO |
| lastAcceptedInviteAt | string | optional |

### `friendRequests/{fromUid_toUid}`

| Field | Type |
|-------|------|
| fromUid | string |
| toUid | string |
| status | pending \| accepted \| declined |
| createdAt / updatedAt | string |

### `usernames/{usernameLower}`

Maps lowercase username → `{ uid, createdAt }` for search and signup.

### `usersPublic/{uid}`

Public profile: `username`, `usernameLower`, `displayName`, `photoURL`, `updatedAt`.

### `usersPrivate/{uid}`

Hangout prefs (used for AI / planning with friends): nickname, hobbies, favouriteFoods, favouriteActivities, personalityNotes, budgetLevel, availabilityNotes, tags, address, updatedAt.

### `hangoutInvites/{inviteId}`

Pending/accepted hangout proposals between friends (see API routes).

---

## Per-user subcollections (still used)

## `users/{userId}/hangoutHistory/{historyId}`

| Field | Type |
|-------|------|
| friendId | string | counterparty Firebase UID |
| friendName | string | denormalized for display |
| activity | string |
| date | string | ISO |
| notes | string |
| rating | number \| null | 1–5 optional |
| createdAt | string | ISO |

## `users/{userId}/savedSuggestions/{suggestionId}`

| Field | Type |
|-------|------|
| friendId | string | counterparty UID |
| title | string |
| reason | string |
| estimatedCost | string |
| estimatedDuration | string |
| nearbyPlaces | array of string |
| inviteText | string | optional |
| createdAt | string | ISO |

## `users/{userId}/settings/app`

Single doc id `app` (or flexible `settings/{docId}`). App preferences (theme, defaults).

---

## Legacy (not used by current API)

The following was an earlier sketch for **local-only** friend cards. The product uses the **social graph** above instead.

~~`users/{userId}/friends/{friendId}`~~ — rich local fields (name, phone, etc.) — **not implemented** in the current Express API.

---

## Emulator

From Firebase CLI project root (or copy these files into your Firebase project):

```bash
firebase emulators:start --only firestore
```

Point `api` `FIRESTORE_EMULATOR_HOST` (e.g. `127.0.0.1:8080`) when using the emulator; set `GOOGLE_APPLICATION_CREDENTIALS` or `FIREBASE_*` for production Admin SDK.
