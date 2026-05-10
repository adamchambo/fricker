import { Router } from "express";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";
import { getUserId } from "../middleware/get-user-id.js";
import * as mock from "../mock/handlers.js";
import { searchUsernamesByPrefix, uidForUsername } from "../services/social/graph.js";
import { normalizeUsername } from "../services/social/ids.js";
import { getPublicProfile } from "../services/social/profiles.js";

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get("/users/search", async (req, res) => {
  const viewerUid = getUserId(req);
  const q = typeof req.query.q === "string" ? req.query.q : "";
  if (env.useMockData) {
    res.json({ users: mock.mockSearchUsers(viewerUid, q) });
    return;
  }
  const hits = await searchUsernamesByPrefix(q, 20);
  const enriched = [];
  for (const h of hits) {
    if (h.uid === viewerUid) continue;
    const pub = await getPublicProfile(h.uid);
    if (pub) enriched.push(pub);
  }
  res.json({ users: enriched });
});

usersRouter.get("/users/by-username/:username", async (req, res) => {
  const viewerUid = getUserId(req);
  const uname = normalizeUsername(req.params.username);
  if (env.useMockData) {
    const pub = mock.mockGetUserByUsername(viewerUid, uname);
    if (!pub) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(pub);
    return;
  }
  const uid = await uidForUsername(uname);
  if (!uid) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const pub = await getPublicProfile(uid);
  if (!pub) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(pub);
});
