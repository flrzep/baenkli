"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);
  const [open, setOpen] = useState(false);
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIsAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => setIsAuthed(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button aria-label="Toggle navigation" className="md:hidden" onClick={() => setOpen(!open)}>
            <span className="block h-0.5 w-6 bg-foreground mb-1"></span>
            <span className="block h-0.5 w-6 bg-foreground mb-1"></span>
            <span className="block h-0.5 w-6 bg-foreground"></span>
          </button>
          <Link href="/" className="flex items-center">
            <img src="/nav-bar.png" alt="Bänkli" className="h-12" />
          </Link>
          <nav className="hidden gap-4 md:flex">
            <Link href="/" className={pathname === "/" ? "text-primary" : "text-muted-foreground"}>Home</Link>
            {isAuthed && (
              <Link href="/dashboard" className={pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"}>Dashboard</Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {isAuthed ? (
            <Button variant="secondary" onClick={logout}>Logout</Button>
          ) : (
            <>
              <Link href="/login"><Button variant="secondary">Login</Button></Link>
              <Link href="/signup"><Button>Sign up</Button></Link>
            </>
          )}
        </div>
      </div>
      {open && (
        <div className="container mx-auto px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-2">
            <Link onClick={() => setOpen(false)} href="/" className={pathname === "/" ? "text-primary" : "text-muted-foreground"}>Home</Link>
            {isAuthed && (
              <Link onClick={() => setOpen(false)} href="/dashboard" className={pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"}>Dashboard</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}


