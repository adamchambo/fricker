import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { savedSuggestionCreateSchema } from "../schemas/savedSuggestion.js";
import { requireAuth } from "../middleware/auth.js";
import { getUserId } from "../middleware/get-user-id.js";
import * as mock from "../mock/handlers.js";
import { db } from "../services/firebase-admin.js";

export const savedSuggestionsRouter = Router();

savedSuggestionsRouter.use(requireAuth);

function savedCol(uid: string) {
  return db.collection("users").doc(uid).collection("savedSuggestions");
}

const savedDocSchema = savedSuggestionCreateSchema.extend({
  id: z.string(),
  createdAt: z.string(),
});

savedSuggestionsRouter.get("/saved-suggestions", async (req, res) => {
  const userId = getUserId(req);
  if (env.useMockData) {
    const items = mock.mockListSaved(userId).map((row) => {
      const p = savedDocSchema.safeParse(row);
      return p.success ? p.data : null;
    });
    res.json({ savedSuggestions: items.filter(Boolean) });
    return;
  }
  const snap = await savedCol(userId).orderBy("createdAt", "desc").limit(100).get();
  const items = snap.docs.map((d) => {
    const parsed = savedDocSchema.safeParse({ id: d.id, ...d.data() });
    return parsed.success ? parsed.data : null;
  });
  res.json({ savedSuggestions: items.filter(Boolean) });
});

savedSuggestionsRouter.post("/saved-suggestions", async (req, res) => {
  const userId = getUserId(req);
  const parsed = savedSuggestionCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  if (env.useMockData) {
    const row = mock.mockPostSaved(userId, parsed.data);
    res.status(201).json(savedDocSchema.parse(row));
    return;
  }
  const now = new Date().toISOString();
  const ref = await savedCol(userId).add({
    ...parsed.data,
    createdAt: now,
  });
  const created = await ref.get();
  res.status(201).json(savedDocSchema.parse({ id: created.id, ...created.data() }));
});

savedSuggestionsRouter.delete("/saved-suggestions/:id", async (req, res) => {
  const userId = getUserId(req);
  if (env.useMockData) {
    const ok = mock.mockDeleteSaved(userId, req.params.id);
    if (!ok) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.status(204).send();
    return;
  }
  const ref = savedCol(userId).doc(req.params.id);
  const doc = await ref.get();
  if (!doc.exists) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await ref.delete();
  res.status(204).send();
});
