"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/types";

type GalleryItem = { path: string; url: string };

export function BenchGallery({ benchId, fullWidth = false, refreshKey, canDelete = false, onDeleted }: { benchId: string, fullWidth?: boolean, refreshKey?: number, canDelete?: boolean, onDeleted?: (path: string) => void }) {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET_BENCHES || "benches";
      const { data, error } = await supabase.storage.from(bucket).list(`${benchId}`, {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });
      if (error || !data) {
        setItems([]);
        return;
      }
      const list = data
        .filter((f) => f.name && !f.name.endsWith("/"))
        .map((f) => `${benchId}/${f.name}`);
      const urls = list.map((path) => {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return { path, url: data.publicUrl } as GalleryItem;
      });
      setItems(urls);
    };
    load();
  }, [benchId, refreshKey]);

  async function handleDelete(path: string) {
    setError(null);
    try {
      const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET_BENCHES || "benches";
      const { error } = await supabase.storage.from(bucket).remove([path]);
      if (error) throw error;
      setItems((prev) => prev.filter((i) => i.path !== path));
      onDeleted?.(path);
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete image");
    }
  }

  if (!items.length) return null;

  return (
    <div className="mt-2 h-full">
      <div className={`flex gap-3 overflow-x-auto scrollbar-hide pb-2 h-full `}>
        {items.map((it) => (
          <div key={it.path} className={`relative flex-shrink-0 h-full overflow-hidden rounded-lg shadow-md ${fullWidth ? 'w-full' : 'w-64'}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.url} alt="Bench" className="h-full w-full object-cover" />
            {canDelete && (
              <button
                type="button"
                onClick={() => handleDelete(it.path)}
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                aria-label="Delete image"
                title="Delete image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.036-1.005 12.063A3.75 3.75 0 0 1 15.166 22h-6.33a3.75 3.75 0 0 1-3.742-3.278L4.09 6.659l-.209.036a.75.75 0 0 1-.256-1.478 48.567 48.567 0 0 1 3.877-.512v-.227C7.502 3.107 8.61 2 10 2h4c1.39 0 2.498 1.107 2.5 2.478ZM9.75 8a.75.75 0 0 0-1.5 0v9.75a.75.75 0 0 0 1.5 0V8Zm6 0a.75.75 0 0 0-1.5 0v9.75a.75.75 0 0 0 1.5 0V8Z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
      {error && <div className="text-red-600 text-xs mt-1">{error}</div>}
    </div>
  );
}


