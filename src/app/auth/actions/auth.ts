"use server";

import { createServerClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
export async function signIn() {
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);

  const origin = process.env.NEXT_PUBLIC_SITE_URL || "";

  const { error, data } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/api/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    console.error("Erro no login:", error);
    throw error;
  }

  if (!data?.url) {
    throw new Error("URL de redirecionamento não encontrada");
  }

  return redirect(data.url);
}
