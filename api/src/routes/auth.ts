import { Router } from "express";
import { z } from "zod";
import { adminAuth } from "../services/firebase-admin.js";

export const authRouter = Router();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/** Creates Firebase Auth user (server-side). Client should sign in with the same credentials. */
authRouter.post("/auth/signup", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { email, password } = parsed.data;
  try {
    const user = await adminAuth.createUser({ email, password });
    res.status(201).json({ uid: user.uid, email: user.email });
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? String((e as { code: string }).code) : "";
    if (code.includes("email-already-exists")) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }
    res.status(500).json({ error: "Signup failed" });
  }
});

/**
 * Password verification belongs in Firebase client SDK.
 * This route documents the contract; returns guidance for API-only clients.
 */
authRouter.post("/auth/login", (_req, res) => {
  res.status(400).json({
    error: "Use Firebase Auth on the client (signInWithEmailAndPassword or OAuth), then send the ID token as Authorization: Bearer <token> to protected routes.",
  });
});
