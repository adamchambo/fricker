import { z } from "zod";

export const usersPublicWriteSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/, "Username may contain letters, numbers, underscore"),
  displayName: z.string().min(1).max(80),
  /** Empty or omitted = no photo. Non-empty must be a valid absolute URL. */
  photoURL: z.preprocess(
    (val) => {
      if (val === undefined || val === null) return "";
      if (typeof val !== "string") return "";
      return val.trim();
    },
    z.union([z.literal(""), z.string().url()]),
  ),
});

export type UsersPublicWrite = z.infer<typeof usersPublicWriteSchema>;

export const usersPublicDocSchema = usersPublicWriteSchema.extend({
  uid: z.string(),
  usernameLower: z.string(),
  updatedAt: z.string(),
});

export type UsersPublicDoc = z.infer<typeof usersPublicDocSchema>;
