import type { SupabaseClient } from "@supabase/supabase-js";

type Uploadable = { id: string; file: File; preview?: string };

function uniqueName(file: File) {
  const safeName = file.name.replace(/\s+/g, "-");
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;
}

export async function uploadBenchImages(
  supabase: SupabaseClient,
  benchId: string,
  files: Uploadable[],
  bucket = "benches"
) {
  // Require an authenticated user to satisfy the storage policy
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    return {
      uploaded: [],
      errors: files.map((f) => ({ fileId: f.id, message: "You must be signed in to upload images." })),
    };
  }

  const uploaded: { path: string; publicUrl: string }[] = [];
  const errors: { fileId: string; message: string }[] = [];

  for (const f of files) {
    const file = f.file;
    if (!file) {
      errors.push({ fileId: f.id, message: "Missing File object" });
      continue;
    }

    const path = `${benchId}/${uniqueName(file)}`;
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      errors.push({ fileId: f.id, message: uploadError.message });
      continue;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    uploaded.push({ path, publicUrl: data.publicUrl });
  }

  return { uploaded, errors };
}