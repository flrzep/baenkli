import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import dynamic from "next/dynamic";
import { Database } from "@/lib/types";

const BenchesMap = dynamic(() => import("@/components/map"), { ssr: false });

export default async function HomePage() {
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

  const { data: benches } = await supabase.from("benches").select("id,name,location,rating,image");

  return (
    <div className="grid gap-6 md:grid-cols-[1fr]">
      <div className="h-[70vh] w-full overflow-hidden rounded-lg border">
        <BenchesMap benches={benches ?? []} />
      </div>
    </div>
  );
}


