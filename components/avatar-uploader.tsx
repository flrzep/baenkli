"use client";
import { useState } from "react";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/types";
import { Button } from "@/components/ui/button";

type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
};

export function AvatarUploader({ profile }: { profile: Profile }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const [uploading, setUploading] = useState(false);
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const filePath = `${profile.id}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET_AVATARS || "avatars")
      .upload(filePath, file, { upsert: true });
    if (!error && data?.path) {
      const { data: publicUrl } = supabase.storage
        .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET_AVATARS || "avatars")
        .getPublicUrl(data.path);
      setAvatarUrl(publicUrl.publicUrl);
      await supabase.from("profiles").update({ avatar_url: publicUrl.publicUrl }).eq("id", profile.id);
    }
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-full border">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">No avatar</div>
          )}
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          <Button disabled={uploading}>{uploading ? "Uploading..." : "Upload avatar"}</Button>
        </label>
      </div>
    </div>
  );
}


