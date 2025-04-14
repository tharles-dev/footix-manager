"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";

export function AuthLoader({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        redirect("/auth/login");
      }
    }

    checkAuth();
  }, [supabase]);

  return children;
}
