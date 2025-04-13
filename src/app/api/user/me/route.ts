import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { apiResponse, apiError } from "@/lib/api/utils";

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Get session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return apiError(
        { message: "Not authenticated", code: "NOT_AUTHENTICATED" },
        401
      );
    }

    // Get user data
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (userError) {
      return apiError(
        { message: userError.message, code: "USER_NOT_FOUND" },
        404
      );
    }

    // Get user's club if exists
    const { data: club } = await supabase
      .from("clubs")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    return apiResponse({
      user,
      club: club || null,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return apiError(
      {
        message: "Internal server error",
        code: "INTERNAL_SERVER_ERROR",
      },
      500
    );
  }
}
