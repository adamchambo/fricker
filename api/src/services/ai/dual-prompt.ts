import type { PersonHangoutContext } from "./provider.interface.js";

export function dualHangoutPrompt(viewer: PersonHangoutContext, counterparty: PersonHangoutContext): string {
  return [
    "Two people who are already friends on fricker (a friend-picker app). Propose 3 concrete hangout ideas that fit BOTH profiles.",
    "",
    "Viewer (you):",
    JSON.stringify(viewer, null, 2),
    "",
    "Friend:",
    JSON.stringify(counterparty, null, 2),
  ].join("\n");
}
