import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export default async function Home() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Verifica se há um código de autenticação na URL
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const code = searchParams.get("code");

  if (code) {
    // Se houver um código, redireciona para o callback
    return redirect(`/api/auth/callback?code=${code}`);
  }

  // Verifica se o usuário está autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Se não estiver autenticado, redireciona para a página de login
    return redirect("/auth/login");
  }

  // Busca o papel do usuário
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = userData?.role || "user";

  // Redireciona baseado no papel
  if (role === "admin") {
    return redirect("/admin");
  } else {
    return redirect("/web/dashboard");
  }
}
