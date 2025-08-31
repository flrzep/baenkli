"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/types";

interface ReviewDialogProps {
  benchId: string;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function ReviewDialog({ benchId, open, onClose, onSaved }: ReviewDialogProps) {
  const [ratingLocation, setRatingLocation] = useState<number>(3);
  const [ratingComfort, setRatingComfort] = useState<number>(3);
  const [comment, setComment] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  if (!open) return null;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setError(null);
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id ?? null;
      if (!userId) {
        setUid(null);
        setExistingId(null);
        setError("You must be signed in to add a review");
        return;
      }
      if (cancelled) return;
      setUid(userId);
      const { data: rows } = await supabase
        .from("bench_ratings")
        .select("id, rating_location, rating_comfort, comment")
        .eq("bench_id", benchId)
        .eq("profile_id", userId)
        .limit(1);
      if (cancelled) return;
      const r = Array.isArray(rows) && rows.length ? rows[0] as any : null;
      if (r) {
        setExistingId(r.id as string);
        if (typeof r.rating_location === "number") setRatingLocation(r.rating_location);
        if (typeof r.rating_comfort === "number") setRatingComfort(r.rating_comfort);
        setComment(r.comment ?? "");
      } else {
        setExistingId(null);
      }
    };
    if (open && benchId) {
      load();
    }
    return () => {
      cancelled = true;
    };
  }, [open, benchId, supabase]);

  const doSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) {
        setError("You must be signed in to add a review");
        return;
      }
      // Basic validation
      const rl = Math.max(0, Math.min(5, ratingLocation));
      const rc = Math.max(0, Math.min(5, ratingComfort));

      let errorObj;
      if (existingId) {
        const { error } = await supabase
          .from("bench_ratings")
          .update({ rating_location: rl, rating_comfort: rc, comment: comment || null })
          .eq("id", existingId);
        errorObj = error;
      } else {
        const { error } = await supabase
          .from("bench_ratings")
          .insert({ bench_id: benchId, profile_id: uid, rating_location: rl, rating_comfort: rc, comment: comment || null });
        errorObj = error;
      }

      if (errorObj) {
        setError(errorObj.message);
        return;
      }

      onSaved?.();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save review");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/40 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
  <h2 className="text-lg font-semibold mb-4">{existingId ? "Edit your review" : "Add a review"}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={5}
                step={0.5}
                value={ratingLocation}
                onChange={(e) => setRatingLocation(parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-sm w-8 text-right">{ratingLocation.toFixed(1)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Comfort</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={5}
                step={0.5}
                value={ratingComfort}
                onChange={(e) => setRatingComfort(parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-sm w-8 text-right">{ratingComfort.toFixed(1)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Comment (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
              placeholder="Share your thoughts about this bench"
            />
          </div>
        </div>

        <div className="mt-5 flex gap-2 justify-end">
          <button
            type="button"
            className="text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={doSave}
            className="text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-5 py-2.5"
          >
            {saving ? "Saving..." : existingId ? "Update review" : "Save review"}
          </button>
        </div>

        {error && <div className="text-red-500 mt-3 text-sm">{error}</div>}
      </div>
    </div>
  );
}
