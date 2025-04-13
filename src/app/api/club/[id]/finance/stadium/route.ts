import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { validateData } from "@/lib/api/validation";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { invalidateCache } from "@/lib/api/cache";
import { ApiError } from "@/lib/api/error";
import { updateStadiumCapacitySchema } from "@/lib/api/schemas/club";

// PUT /api/club/[id]/finance/stadium
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("club-stadium-update", 5, 60); // 5 requisições por minuto

    // Obtém e valida os dados
    const body = await request.json();
    const data = validateData(updateStadiumCapacitySchema, body);

    // Verifica se o clube existe e pertence ao usuário
    const { data: club } = await supabase
      .from("clubs")
      .select("id, balance")
      .eq("id", params.id)
      .eq("user_id", request.headers.get("user-id"))
      .single();

    if (!club) {
      throw new ApiError({
        message: "Clube não encontrado ou não pertence a você",
        code: "CLUB_NOT_FOUND",
      });
    }

    // Calcula o custo da expansão
    const { data: currentClub } = await supabase
      .from("clubs")
      .select("stadium_capacity")
      .eq("id", params.id)
      .single();

    if (!currentClub) {
      throw new ApiError({
        message: "Erro ao buscar dados do estádio",
        code: "STADIUM_DATA_NOT_FOUND",
      });
    }

    const currentCapacity = currentClub.stadium_capacity;
    const newCapacity = data.stadium_capacity;
    const capacityDiff = newCapacity - currentCapacity;

    if (capacityDiff <= 0) {
      throw new ApiError({
        message: "A nova capacidade deve ser maior que a atual",
        code: "INVALID_CAPACITY",
      });
    }

    // Custo por lugar: 1000
    const costPerSeat = 1000;
    const totalCost = capacityDiff * costPerSeat;

    // Verifica se o clube tem saldo suficiente
    if (club.balance < totalCost) {
      throw new ApiError({
        message: "Saldo insuficiente para expandir o estádio",
        code: "INSUFFICIENT_BALANCE",
      });
    }

    // Atualiza a capacidade e o saldo
    const { error } = await supabase
      .from("clubs")
      .update({
        stadium_capacity: newCapacity,
        balance: club.balance - totalCost,
      })
      .eq("id", params.id);

    if (error) {
      throw new ApiError({
        message: "Erro ao atualizar estádio",
        code: "STADIUM_UPDATE_FAILED",
        details: error,
      });
    }

    // Invalida cache
    await invalidateCache(`club:${params.id}:finance`);

    return NextResponse.json({
      message: "Estádio expandido com sucesso",
      data: {
        new_capacity: newCapacity,
        cost: totalCost,
        new_balance: club.balance - totalCost,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao expandir estádio:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
