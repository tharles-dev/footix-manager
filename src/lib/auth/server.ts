import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function getAuthenticatedUser() {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Usar getUser() em vez de getSession() para autenticação segura
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return {
        authenticated: false,
        error: userError,
      };
    }

    if (!user) {
      return {
        authenticated: false,
      };
    }

    // Buscar dados adicionais do usuário
    const { data: userData, error: dbError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (dbError) {
      return {
        authenticated: false,
        error: dbError,
      };
    }

    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: userData?.role,
      },
    };
  } catch (error) {
    console.error("Erro ao verificar autenticação:", error);
    return {
      authenticated: false,
      error: "Erro interno do servidor",
    };
  }
}
