import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getUserId } from "../middleware/get-user-id.js";

export const meRouter = Router();

meRouter.get("/me", requireAuth, (req, res) => {
  res.json({ uid: getUserId(req) });
});
