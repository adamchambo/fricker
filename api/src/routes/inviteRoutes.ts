import { Router } from "express";
import { env } from "../config/env.js";
import { hangoutInviteCreateSchema } from "../schemas/hangoutInvite.js";
import { requireAuth } from "../middleware/auth.js";
import { getUserId } from "../middleware/get-user-id.js";
import * as mock from "../mock/handlers.js";
import {
  acceptHangoutInvite,
  createHangoutInvite,
  declineHangoutInvite,
  listInviteInbox,
  listInviteOutbox,
} from "../services/social/invites.js";

function firestoreIndexHint(err: unknown): string | null {
  const message = err instanceof Error ? err.message : String(err);
  const details =
    err && typeof err === "object" && "details" in err ? String((err as { details?: unknown }).details) : "";
  const blob = `${message} ${details}`;
  if (blob.includes("requires an index")) {
    return "Firestore needs a composite index for this query. Deploy db/firestore.indexes.json (see db/firebase.json) or use the create index link in the API server log.";
  }
  return null;
}

export const invitesRouter = Router();

invitesRouter.use(requireAuth);

invitesRouter.post("/invites", async (req, res) => {
  const uid = getUserId(req);
  const parsed = hangoutInviteCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    const id = env.useMockData
      ? mock.mockCreateHangoutInvite(uid, parsed.data)
      : await createHangoutInvite(
          uid,
          parsed.data.counterpartyUid,
          parsed.data.activity,
          parsed.data.message,
        );
    res.status(201).json({ id });
  } catch (e: unknown) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Failed" });
  }
});

invitesRouter.post("/invites/:id/accept", async (req, res) => {
  const uid = getUserId(req);
  try {
    if (env.useMockData) mock.mockAcceptHangoutInvite(uid, req.params.id);
    else await acceptHangoutInvite(uid, req.params.id);
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Failed" });
  }
});

invitesRouter.post("/invites/:id/decline", async (req, res) => {
  const uid = getUserId(req);
  try {
    if (env.useMockData) mock.mockDeclineHangoutInvite(uid, req.params.id);
    else await declineHangoutInvite(uid, req.params.id);
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Failed" });
  }
});

invitesRouter.get("/invites/inbox", async (req, res) => {
  const uid = getUserId(req);
  try {
    const items = env.useMockData ? mock.mockListInviteInbox(uid) : await listInviteInbox(uid);
    res.json({ invites: items });
  } catch (e: unknown) {
    const hint = firestoreIndexHint(e);
    if (hint) {
      res.status(503).json({ error: hint });
      return;
    }
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to list inbox" });
  }
});

invitesRouter.get("/invites/outbox", async (req, res) => {
  const uid = getUserId(req);
  try {
    const items = env.useMockData ? mock.mockListInviteOutbox(uid) : await listInviteOutbox(uid);
    res.json({ invites: items });
  } catch (e: unknown) {
    const hint = firestoreIndexHint(e);
    if (hint) {
      res.status(503).json({ error: hint });
      return;
    }
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to list outbox" });
  }
});
