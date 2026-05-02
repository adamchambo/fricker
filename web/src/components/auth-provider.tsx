"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { getFirebaseAuth, initFirebaseClient } from "@/lib/firebase";
import { useAuthStore } from "@/stores/auth-store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setReady = useAuthStore((s) => s.setReady);

  useEffect(() => {
    const initialized = initFirebaseClient();
    if (!initialized) {
      setUser(null);
      setReady(true);
      return undefined;
    }
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setReady(true);
    });
    return () => unsub();
  }, [setUser, setReady]);

  return children;
}
