import { Router } from "express";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";
import { getUserId } from "../middleware/get-user-id.js";
import * as mock from "../mock/handlers.js";
import { createAiProvider } from "../services/ai/factory.js";
import type { PersonHangoutContext } from "../services/ai/provider.interface.js";
import { assertFriendship } from "../services/social/graph.js";
import { getPrivatePrefs, getPublicProfile } from "../services/social/profiles.js";

export const suggestionsRouter = Router();

suggestionsRouter.use(requireAuth);

async function buildPerson(uid: string): Promise<PersonHangoutContext | null> {
  const pub = await getPublicProfile(uid);
  if (!pub) return null;
  const prefs = await getPrivatePrefs(uid);
  return {
    displayName: pub.displayName,
    username: pub.username,
    ...prefs,
  };
}

function buildPersonMock(viewerUid: string, targetUid: string): PersonHangoutContext | null {
  const pub = mock.mockGetPublicProfile(viewerUid, targetUid);
  if (!pub) return null;
  const prefs = mock.mockGetPrivatePrefs(viewerUid, targetUid);
  return {
    displayName: pub.displayName,
    username: pub.username,
    ...prefs,
  };
}

suggestionsRouter.post("/suggestions/:counterpartyUid/generate", async (req, res) => {
  const viewerUid = getUserId(req);
  const counterpartyUid = req.params.counterpartyUid;

  const ok = env.useMockData
    ? mock.mockAssertFriendship(viewerUid, viewerUid, counterpartyUid)
    : await assertFriendship(viewerUid, counterpartyUid);
  if (!ok) {
    res.status(403).json({ error: "Not friends with this user" });
    return;
  }

  const viewer = env.useMockData ? buildPersonMock(viewerUid, viewerUid) : await buildPerson(viewerUid);
  const counterparty = env.useMockData
    ? buildPersonMock(viewerUid, counterpartyUid)
    : await buildPerson(counterpartyUid);
  if (!viewer || !counterparty) {
    res.status(400).json({
      error:
        "Both users need a public profile (username/display) and prefs on file. Finish onboarding in Profile.",
    });
    return;
  }

  try {
    const provider = createAiProvider();
    const suggestions = await provider.generateSuggestions({ viewer, counterparty });
    res.json({ counterpartyUid, suggestions });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Suggestion failed";
    res.status(502).json({ error: message });
  }
});
