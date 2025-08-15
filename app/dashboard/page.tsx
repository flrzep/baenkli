import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { Database } from "@/lib/types";
import { AvatarUploader } from "@/components/avatar-uploader";
import { BenchForm } from "@/components/bench-form";

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

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <h1 className="mb-4 text-2xl font-semibold">Your Profile</h1>
        <AvatarUploader profile={profile ?? { id: userId, username: "", avatar_url: null }} />
      </div>
      <div>
        <h2 className="mb-4 text-xl font-semibold">Add a Bench</h2>
        <BenchForm />
      </div>
    </div>
  );
}


