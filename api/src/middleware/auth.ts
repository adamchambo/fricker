import type { NextFunction, Request, Response } from "express";
import { adminAuth } from "../services/firebase-admin.js";

export type AuthedRequest = Request & { userId: string };

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) {
    res.status(401).json({ error: "Missing Bearer token" });
    return;
  }
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    (req as AuthedRequest).userId = decoded.uid;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
