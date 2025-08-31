"use client";
import { useEffect, useState } from "react";
import { BenchForm } from "@/components/bench-form";
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function NewBenchEntry() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  useEffect(() => {
    setError(null);
  }, [open]);

  const requireAuth = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) {
      router.push("/login");
      return false;
    }
    return true;
  };

  return (
    <>
      <button
        className="inline-flex items-center justify-center rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 w-12 h-12"
        aria-label="Add bench"
        onClick={async () => {
          if (await requireAuth()) setOpen(true);
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5H12.75v6.75a.75.75 0 0 1-1.5 0V12.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-semibold mb-4">Add a Bench</h2>
            <BenchForm
              onCreated={() => {
                setOpen(false);
                window.location.reload();
              }}
            />
            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          </div>
        </div>
      )}
    </>
  );
}
