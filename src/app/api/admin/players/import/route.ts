import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { ApiError } from "@/lib/api/error";
import { parse } from "papaparse";
import { z } from "zod";
import { SupabaseClient } from "@supabase/supabase-js";

const playerSchema = z.object({
  name: z.string(),
  age: z.number(),
  nationality: z.string(),
  position: z.string(),
  overall: z.number(),
  potential: z.number(),
  pace: z.number(),
  shooting: z.number(),
  passing: z.number(),
  dribbling: z.number(),
  defending: z.number(),
  physical: z.number(),
  base_value: z.number(),
  base_salary: z.number(),
});

type PlayerData = z.infer<typeof playerSchema>;

// Função para processar jogadores em lotes
async function processBatch(
  supabase: SupabaseClient,
  players: PlayerData[],
  batchSize: number = 100
) {
  const totalPlayers = players.length;
  const batches = Math.ceil(totalPlayers / batchSize);
  let importedCount = 0;
  const errors: Array<{
    batch: number;
    error: string;
    players: number;
  }> = [];

  for (let i = 0; i < batches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, totalPlayers);
    const batch = players.slice(start, end);

    try {
      const { error } = await supabase.from("global_players").insert(batch);

      if (error) {
        console.error(`Erro ao importar lote ${i + 1}/${batches}:`, error);
        errors.push({
          batch: i + 1,
          error: error.message,
          players: batch.length,
        });
      } else {
        importedCount += batch.length;
      }
    } catch (error) {
      console.error(`Erro ao processar lote ${i + 1}/${batches}:`, error);
      errors.push({
        batch: i + 1,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        players: batch.length,
      });
    }
  }

  return { importedCount, errors };
}

export async function POST(req: NextRequest) {
  try {
    await checkRateLimit(req.url);
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new ApiError({
        message: "Unauthorized",
        code: "UNAUTHORIZED",
      });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userData || userData.role !== "admin") {
      throw new ApiError({
        message: "Forbidden",
        code: "FORBIDDEN",
      });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const batchSize = parseInt(formData.get("batchSize") as string) || 100;

    if (!file) {
      throw new ApiError({
        message: "No file provided",
        code: "BAD_REQUEST",
      });
    }

    const fileContent = await file.text();
    const { data, errors } = parse<PlayerData>(fileContent, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });

    if (errors.length > 0) {
      console.error("Erro ao importar jogadores:", errors);
      throw new ApiError({
        message: "Invalid CSV format",
        code: "BAD_REQUEST",
      });
    }

    const validatedPlayers = data.map((player) => {
      const result = playerSchema.safeParse(player);
      if (!result.success) {
        throw new ApiError({
          message: `Invalid player data: ${result.error.message}`,
          code: "BAD_REQUEST",
        });
      }
      return result.data;
    });

    // Processar em lotes
    const { importedCount, errors: batchErrors } = await processBatch(
      supabase,
      validatedPlayers,
      batchSize
    );

    return NextResponse.json({
      message: "Players imported successfully",
      count: importedCount,
      total: validatedPlayers.length,
      errors: batchErrors.length > 0 ? batchErrors : undefined,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        {
          status:
            error.code === "UNAUTHORIZED"
              ? 401
              : error.code === "FORBIDDEN"
              ? 403
              : error.code === "BAD_REQUEST"
              ? 400
              : 500,
        }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
