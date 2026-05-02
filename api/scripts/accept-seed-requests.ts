/**
 * Accepts all pending friend requests where the recipient is a seed test user (MOCK_USERS).
 * Run from api/:  npm run seed:accept-requests
 *
 * Use after your real account has sent requests to @river_m, @case_n, etc.
 */
import "dotenv/config";
import {
  acceptFriendRequest,
  listIncomingRequests,
  uidForUsername,
} from "../src/services/social/graph.js";
import { normalizeUsername } from "../src/services/social/ids.js";
import { MOCK_USERS } from "./mock-seed-users-list.js";

async function main() {
  let total = 0;
  for (const u of MOCK_USERS) {
    const uname = normalizeUsername(u.username);
    const toUid = await uidForUsername(uname);
    if (!toUid) {
      console.warn(`No Firestore user for @${uname} — run seed:mock-users first`);
      continue;
    }
    const incoming = await listIncomingRequests(toUid);
    for (const r of incoming) {
      await acceptFriendRequest(toUid, r.fromUid);
      console.log(`Accepted request from ${r.fromUid} → @${uname} (${toUid})`);
      total += 1;
    }
  }
  if (total === 0) {
    console.log("No pending incoming requests for seed users.");
  } else {
    console.log(`\nDone. Accepted ${total} request(s). Refresh Friends in the app.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
