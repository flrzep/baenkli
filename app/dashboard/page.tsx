import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { Database } from "@/lib/types";
import { AvatarUploader } from "@/components/avatar-uploader";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login");
  }

  const userId = session.user.id;
  const { data: profile } = await supabase.from("profiles").select("id, username, avatar_url").eq("id", userId).single();

  const { data: benches } = await supabase
    .from("benches")
    .select("id, name, type, rating, n_reviews, created_at")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <h1 className="mb-4 text-2xl font-semibold">Your Profile</h1>
        <AvatarUploader profile={profile ?? { id: userId, username: "", avatar_url: null }} />
      </div>
      <div>
        <h2 className="mb-4 text-xl font-semibold">Your Benches</h2>
        {!benches || benches.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">You haven't created any benches yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            {benches.map((b) => (
              <li key={b.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium truncate">{b.name ?? "Untitled bench"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {b.type ?? "-"}
                    {typeof b.rating === "number" && (
                      <>
                        <span className="mx-2">•</span>
                        Rating {b.rating.toFixed(2)}
                      </>
                    )}
                    {typeof b.n_reviews === "number" && (
                      <>
                        <span className="mx-2">•</span>
                        {b.n_reviews} reviews
                      </>
                    )}
                  </p>
                </div>
                <div className="text-xs text-gray-400">
                  {b.created_at ? new Date(b.created_at as unknown as string).toLocaleDateString() : ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


