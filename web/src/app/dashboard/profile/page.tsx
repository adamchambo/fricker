"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { ProfilePageSkeleton } from "@/components/dashboard-skeletons";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { HangoutPrefs, PublicProfile } from "@/types/social";

type ProfileMeResponse = {
  uid: string;
  public: PublicProfile | null;
  prefs: HangoutPrefs;
};

export default function MyProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");

  const [nickname, setNickname] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [favouriteFoods, setFavouriteFoods] = useState("");
  const [favouriteActivities, setFavouriteActivities] = useState("");
  const [personalityNotes, setPersonalityNotes] = useState("");
  const [budgetLevel, setBudgetLevel] = useState("");
  const [availabilityNotes, setAvailabilityNotes] = useState("");
  const [address, setAddress] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<ProfileMeResponse>("/api/profile/me", { method: "GET" });
      const pub = res.public;
      if (pub) {
        setUsername(pub.username);
        setDisplayName(pub.displayName);
        setPhotoURL(pub.photoURL);
      }
      const p = res.prefs;
      setNickname(p.nickname);
      setHobbies(p.hobbies);
      setFavouriteFoods(p.favouriteFoods);
      setFavouriteActivities(p.favouriteActivities);
      setPersonalityNotes(p.personalityNotes);
      setBudgetLevel(p.budgetLevel);
      setAvailabilityNotes(p.availabilityNotes);
      setAddress(p.address);
      setTagsInput((p.tags ?? []).join(", "));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function savePublic(e: React.FormEvent) {
    e.preventDefault();
    setSavedMsg(null);
    setError(null);
    try {
      const trimmedPhoto = photoURL.trim();
      await apiFetch("/api/profile/public", {
        method: "POST",
        body: JSON.stringify({
          username: username.trim(),
          displayName: displayName.trim(),
          ...(trimmedPhoto ? { photoURL: trimmedPhoto } : {}),
        }),
      });
      setSavedMsg("Public profile saved.");
      await load();
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Save failed");
    }
  }

  async function savePrefs(e: React.FormEvent) {
    e.preventDefault();
    setSavedMsg(null);
    setError(null);
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    try {
      await apiFetch("/api/profile/prefs", {
        method: "PATCH",
        body: JSON.stringify({
          nickname: nickname.trim(),
          hobbies: hobbies.trim(),
          favouriteFoods: favouriteFoods.trim(),
          favouriteActivities: favouriteActivities.trim(),
          personalityNotes: personalityNotes.trim(),
          budgetLevel: budgetLevel.trim(),
          availabilityNotes: availabilityNotes.trim(),
          address: address.trim(),
          tags,
        }),
      });
      setSavedMsg("Hangout prefs saved.");
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Save failed");
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]";

  if (loading) {
    return <ProfilePageSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Your profile</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          @username is public for search. Hangout prefs help fricker suggest plans with friends.
        </p>
        <p className="mt-2 text-sm">
          <Link href="/dashboard/friends" className="text-[var(--accent)] hover:underline">
            Friends
          </Link>
        </p>
      </div>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {savedMsg ? <p className="text-sm text-[var(--muted)]">{savedMsg}</p> : null}

      <form onSubmit={(e) => void savePublic(e)} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-medium text-[var(--foreground)]">Public</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="text-[var(--muted)]">Username (3–24, letters, numbers, _)</span>
            <input className={inputClass} value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-[var(--muted)]">Display name</span>
            <input className={inputClass} value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-[var(--muted)]">Photo URL (optional)</span>
            <input
              className={inputClass}
              type="text"
              inputMode="url"
              placeholder="Optional — leave blank"
              autoComplete="off"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
            />
          </label>
        </div>
        <button type="submit" className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white">
          Save public profile
        </button>
      </form>

      <form onSubmit={(e) => void savePrefs(e)} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-medium text-[var(--foreground)]">Hangout prefs</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">Shared with friends for planning (same as API today).</p>
        <div className="mt-4 grid gap-3">
          {(
            [
              ["Nickname", nickname, setNickname],
              ["Hobbies", hobbies, setHobbies],
              ["Favourite foods", favouriteFoods, setFavouriteFoods],
              ["Favourite activities", favouriteActivities, setFavouriteActivities],
              ["Personality notes", personalityNotes, setPersonalityNotes],
              ["Budget (e.g. low / medium / high)", budgetLevel, setBudgetLevel],
              ["Availability", availabilityNotes, setAvailabilityNotes],
              ["Area / suburb", address, setAddress],
            ] as Array<[string, string, Dispatch<SetStateAction<string>>]>
          ).map(([label, val, set]) => (
            <label key={String(label)} className="block text-sm">
              <span className="text-[var(--muted)]">{label}</span>
              <input
                className={inputClass}
                value={val as string}
                onChange={(e) => (set as (v: string) => void)(e.target.value)}
              />
            </label>
          ))}
          <label className="block text-sm">
            <span className="text-[var(--muted)]">Tags (comma-separated)</span>
            <input className={inputClass} value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
          </label>
        </div>
        <button type="submit" className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white">
          Save prefs
        </button>
      </form>
    </div>
  );
}
