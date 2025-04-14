import { apiResponse, apiError } from "@/lib/api/utils";
import { getAuthenticatedUser } from "@/lib/auth/server";

export async function GET() {
  try {
    const auth = await getAuthenticatedUser();

    if (auth.error) {
      const errorMessage =
        typeof auth.error === "string"
          ? auth.error
          : auth.error.message || "Erro ao verificar autenticação";

      return apiError(
        {
          code: "AUTH_ERROR",
          message: errorMessage,
        },
        400
      );
    }

    if (!auth.authenticated) {
      return apiResponse({ authenticated: false });
    }

    return apiResponse({
      authenticated: true,
      user: auth.user,
    });
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
