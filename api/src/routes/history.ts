import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { hangoutHistoryCreateSchema } from "../schemas/history.js";
import { requireAuth } from "../middleware/auth.js";
import { getUserId } from "../middleware/get-user-id.js";
import * as mock from "../mock/handlers.js";
import { db } from "../services/firebase-admin.js";

export const historyRouter = Router();

historyRouter.use(requireAuth);

function historyCol(uid: string) {
  return db.collection("users").doc(uid).collection("hangoutHistory");
}

const historyDocSchema = hangoutHistoryCreateSchema.extend({
  id: z.string(),
  createdAt: z.string(),
});

historyRouter.get("/history", async (req, res) => {
  const userId = getUserId(req);
  if (env.useMockData) {
    const items = mock.mockListHistory(userId).map((row) => {
      const p = historyDocSchema.safeParse(row);
      return p.success ? p.data : null;
    });
    res.json({ history: items.filter(Boolean) });
    return;
  }
  const snap = await historyCol(userId).orderBy("date", "desc").limit(100).get();
  const items = snap.docs.map((d) => {
    const parsed = historyDocSchema.safeParse({ id: d.id, ...d.data() });
    return parsed.success ? parsed.data : null;
  });
  res.json({ history: items.filter(Boolean) });
});

historyRouter.post("/history", async (req, res) => {
  const userId = getUserId(req);
  const parsed = hangoutHistoryCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  if (env.useMockData) {
    const row = mock.mockPostHistory(userId, parsed.data);
    res.status(201).json(historyDocSchema.parse(row));
    return;
  }
  const now = new Date().toISOString();
  const ref = await historyCol(userId).add({
    ...parsed.data,
    createdAt: now,
  });
  const created = await ref.get();
  res.status(201).json(historyDocSchema.parse({ id: created.id, ...created.data() }));
});
