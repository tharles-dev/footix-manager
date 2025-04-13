import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { apiResponse, apiError } from "@/lib/api/utils";

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      return apiError({ message: error.message, code: "AUTH_ERROR" }, 401);
    }

    if (!session) {
      return apiError(
        { message: "Not authenticated", code: "NOT_AUTHENTICATED" },
        401
      );
    }

    return apiResponse({ session });
  } catch (error) {
    console.error("Login error:", error);
    return apiError(
      {
        message: "Internal server error",
        code: "INTERNAL_SERVER_ERROR",
      },
      500
    );
  }
}
