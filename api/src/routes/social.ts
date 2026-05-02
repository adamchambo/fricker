import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";
import { getUserId } from "../middleware/get-user-id.js";
import * as mock from "../mock/handlers.js";
import {
  acceptFriendRequest,
  createFriendRequest,
  declineFriendRequest,
  getFriendDetail,
  listFriends,
  listIncomingRequests,
  listOutgoingRequests,
  removeFriendship,
  reorderFriends,
} from "../services/social/graph.js";

export const socialRouter = Router();

socialRouter.use(requireAuth);

const requestBodySchema = z.object({
  toUsername: z.string().min(1),
});

socialRouter.post("/friends/requests", async (req, res) => {
  const uid = getUserId(req);
  const parsed = requestBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    const result = env.useMockData
      ? mock.mockCreateFriendRequest(uid, parsed.data.toUsername)
      : await createFriendRequest(uid, parsed.data.toUsername);
    res.status(201).json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed";
    const code =
      msg === "User not found" ? 404 : msg === "Already friends" || msg.includes("pending") ? 409 : 400;
    res.status(code).json({ error: msg });
  }
});

socialRouter.get("/friends/requests/incoming", async (req, res) => {
  const uid = getUserId(req);
  const items = env.useMockData ? mock.mockListIncomingRequests(uid) : await listIncomingRequests(uid);
  res.json({ requests: items });
});

socialRouter.get("/friends/requests/outgoing", async (req, res) => {
  const uid = getUserId(req);
  const items = env.useMockData ? mock.mockListOutgoingRequests(uid) : await listOutgoingRequests(uid);
  res.json({ requests: items });
});

const fromUidBody = z.object({
  fromUid: z.string().min(1),
});

socialRouter.post("/friends/requests/accept", async (req, res) => {
  const uid = getUserId(req);
  const parsed = fromUidBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    if (env.useMockData) mock.mockAcceptFriendRequest(uid, parsed.data.fromUid);
    else await acceptFriendRequest(uid, parsed.data.fromUid);
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Failed" });
  }
});

socialRouter.post("/friends/requests/decline", async (req, res) => {
  const uid = getUserId(req);
  const parsed = fromUidBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    if (env.useMockData) mock.mockDeclineFriendRequest(uid, parsed.data.fromUid);
    else await declineFriendRequest(uid, parsed.data.fromUid);
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Failed" });
  }
});

socialRouter.get("/friends", async (req, res) => {
  const uid = getUserId(req);
  const friends = env.useMockData ? mock.mockListFriends(uid) : await listFriends(uid);
  res.json({ friends });
});

socialRouter.get("/friends/:counterpartyUid", async (req, res) => {
  const uid = getUserId(req);
  const counterpartyUid = req.params.counterpartyUid;
  const detail = env.useMockData
    ? mock.mockGetFriendDetail(uid, counterpartyUid)
    : await getFriendDetail(uid, counterpartyUid);
  if (!detail) {
    res.status(404).json({ error: "Friend not found" });
    return;
  }
  res.json(detail);
});

socialRouter.delete("/friends/:counterpartyUid", async (req, res) => {
  const uid = getUserId(req);
  const counterpartyUid = req.params.counterpartyUid;
  try {
    if (env.useMockData) mock.mockRemoveFriendship(uid, counterpartyUid);
    else await removeFriendship(uid, counterpartyUid);
    res.status(204).send();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed";
    const code = msg === "Not friends with this user" ? 404 : 400;
    res.status(code).json({ error: msg });
  }
});

const orderBody = z.object({
  orderedCounterpartyUids: z.array(z.string().min(1)).min(1),
});

socialRouter.patch("/friends/order", async (req, res) => {
  const uid = getUserId(req);
  const parsed = orderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  if (env.useMockData) mock.mockReorderFriends(uid, parsed.data.orderedCounterpartyUids);
  else await reorderFriends(uid, parsed.data.orderedCounterpartyUids);
  res.json({ ok: true });
});
