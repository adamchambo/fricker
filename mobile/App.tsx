import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { apiFetch } from "./lib/api";
import { getFirebaseAuth } from "./lib/firebase";

type Friend = {
  id: string;
  name: string;
  nickname?: string;
};

type FriendsApiRow = {
  counterpartyUid: string;
  profile: { displayName: string; username: string };
};

type FriendsResponse = { friends: FriendsApiRow[] };

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      const auth = getFirebaseAuth();
      unsub = onAuthStateChanged(auth, (u) => {
        setUserId(u?.uid ?? null);
        setFriends(null);
        setMe(null);
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Firebase not configured");
    }
    return () => unsub?.();
  }, []);

  const loadFriends = useCallback(async () => {
    if (!userId) return;
    setError(null);
    setBusy(true);
    try {
      const m = await apiFetch<{ uid: string }>("/api/me", { method: "GET" });
      setMe(m.uid);
      const res = await apiFetch<FriendsResponse>("/api/friends", { method: "GET" });
      setFriends(
        res.friends.map((row) => ({
          id: row.counterpartyUid,
          name: row.profile.displayName,
          nickname: row.profile.username,
        })),
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "API error");
      setFriends([]);
    } finally {
      setBusy(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      void loadFriends();
    }
  }, [userId, loadFriends]);

  async function login() {
    setError(null);
    setBusy(true);
    try {
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    try {
      await signOut(getFirebaseAuth());
    } catch {
      /* ignore */
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>fricker</Text>
      <Text style={styles.sub}>The friend picker — same API as the web app. Sign in to load your friends.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!userId ? (
        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />
          <Button title={busy ? "Please wait…" : "Log in"} onPress={() => void login()} disabled={busy} />
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.ok}>Signed in{me ? ` · ${me}` : ""}</Text>
          {busy && friends === null ? <ActivityIndicator style={{ marginVertical: 12 }} /> : null}
          {friends && friends.length === 0 ? <Text style={styles.muted}>No friends yet.</Text> : null}
          {friends && friends.length > 0 ? (
            <View style={{ marginTop: 12 }}>
              {friends.map((f) => (
                <Text key={f.id} style={styles.friend}>
                  {f.name}
                  {f.nickname ? ` (${f.nickname})` : ""}
                </Text>
              ))}
            </View>
          ) : null}
          <View style={{ height: 16 }} />
          <Button title="Refresh" onPress={() => void loadFriends()} />
          <View style={{ height: 8 }} />
          <Button title="Log out" onPress={() => void logout()} color="#b91c1c" />
        </View>
      )}
      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 48,
    backgroundColor: "#f8fafc",
    flexGrow: 1,
  },
  title: { fontSize: 28, fontWeight: "700", color: "#0f172a" },
  sub: { marginTop: 8, color: "#64748b", marginBottom: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  label: { fontSize: 12, color: "#64748b", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    color: "#0f172a",
  },
  error: { color: "#b91c1c", marginBottom: 12 },
  ok: { color: "#0f172a", fontWeight: "600" },
  muted: { color: "#64748b" },
  friend: { marginTop: 6, color: "#0f172a" },
});
