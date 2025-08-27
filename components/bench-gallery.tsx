"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/types";

export function BenchGallery({ benchId, fullWidth = false }: { benchId: string, fullWidth?: boolean }) {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET_BENCHES || "benches";
      const { data, error } = await supabase.storage.from(bucket).list(`${benchId}`, {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });
      if (error || !data) return;
      const list = data
        .filter((f) => f.name && !f.name.endsWith("/"))
        .map((f) => `${benchId}/${f.name}`);
      const urls = list.map((path) => {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
      });
      setUrls(urls);
    };
    load();
  }, [benchId]);

  if (!urls.length) return null;

  return (
    <div className="mt-2 h-full">
      <div className={`flex gap-3 overflow-x-auto scrollbar-hide pb-2 h-full `}>
        {urls.map((u) => (
          <div key={u} className={`relative flex-shrink-0 h-full overflow-hidden rounded-lg shadow-md ${fullWidth ? 'w-full' : 'w-64'}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="Bench" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}


