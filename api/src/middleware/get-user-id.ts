import type { Request } from "express";
import type { AuthedRequest } from "./auth.js";

export function getUserId(req: Request): string {
  return (req as unknown as AuthedRequest).userId;
}
