import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { apiResponse, apiError } from "@/lib/api/utils";
import { headers } from "next/headers";

export async function POST() {
  try {
    const cookieStore = cookies();
    const headersList = headers();
    const host = headersList.get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

    // Redireciona para a página de login, que será tratada pelo middleware
    const redirectUrl = `${protocol}://${host}/auth/login`;

    const supabase = createClient(cookieStore);
    const { data, error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (authError) {
      return apiError(
        {
          code: "AUTH_ERROR",
          message: "Erro ao fazer login com Google",
        },
        400
      );
    }

    return apiResponse(data);
  } catch (error) {
    console.error("Erro interno:", error);
    return apiError(
      {
        code: "INTERNAL_ERROR",
        message: "Erro interno do servidor",
      },
      500
    );
  }
}
