import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { revalidatePath } from "next/cache";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica rate limit
    const identifier = request.headers.get("user-id") || "anonymous";
    await checkRateLimit(identifier);

    // Obtém o ID do usuário do header
    const userId = request.headers.get("user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário não fornecido" },
        { status: 400 }
      );
    }

    // Obtém o ID do servidor do header
    const serverId = request.headers.get("server-id");
    if (!serverId) {
      return NextResponse.json(
        { error: "ID do servidor não fornecido" },
        { status: 400 }
      );
    }

    // Cria cliente Supabase
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica se o clube existe e pertence ao usuário
    const { data: club, error: clubError } = await supabase
      .from("clubs")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", userId)
      .single();

    if (clubError || !club) {
      return NextResponse.json(
        { error: "Clube não encontrado ou não pertence ao usuário" },
        { status: 404 }
      );
    }

    // Verifica se o clube já tem jogadores
    const { data: existingPlayers, error: playersError } = await supabase
      .from("server_players")
      .select("id")
      .eq("club_id", params.id)
      .limit(1);

    if (playersError) {
      return NextResponse.json(
        { error: "Erro ao verificar jogadores existentes" },
        { status: 500 }
      );
    }

    if (existingPlayers && existingPlayers.length > 0) {
      return NextResponse.json(
        {
          error:
            "O clube já possui jogadores. O pack inicial só pode ser gerado uma vez.",
        },
        { status: 400 }
      );
    }

    // Chama a função para gerar o pack inicial
    const { data: players, error: packError } = await supabase.rpc(
      "generate_initial_player_pack",
      {
        p_club_id: params.id,
        p_server_id: serverId,
      }
    );

    if (packError) {
      console.error("Erro ao gerar pack inicial:", packError);
      return NextResponse.json(
        { error: "Erro ao gerar pack inicial de jogadores" },
        { status: 500 }
      );
    }

    // Se a lista de jogadores estiver vazia, limpa o cache
    if (!players || players.length === 0) {
      // Limpa o cache para a rota do clube
      revalidatePath(`/web/club/${params.id}`);
      revalidatePath(`/web/dashboard`);

      return NextResponse.json({
        message: "Pack inicial gerado, mas nenhum jogador foi criado",
        data: {
          players: [],
          count: 0,
        },
      });
    }

    return NextResponse.json({
      message: "Pack inicial gerado com sucesso",
      data: {
        players,
        count: players.length,
      },
    });
  } catch (error) {
    console.error("Erro ao processar pack inicial:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica rate limit
    const identifier = request.headers.get("user-id") || "anonymous";
    await checkRateLimit(identifier);

    // Obtém o ID do usuário do header
    const userId = request.headers.get("user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário não fornecido" },
        { status: 400 }
      );
    }

    // Cria cliente Supabase
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica se o clube existe e pertence ao usuário
    const { data: club, error: clubError } = await supabase
      .from("clubs")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", userId)
      .single();

    if (clubError || !club) {
      return NextResponse.json(
        { error: "Clube não encontrado ou não pertence ao usuário" },
        { status: 404 }
      );
    }

    // Busca os jogadores do clube
    const { data: players, error: playersError } = await supabase
      .from("server_players")
      .select("*")
      .eq("club_id", params.id);

    if (playersError) {
      return NextResponse.json(
        { error: "Erro ao buscar jogadores do clube" },
        { status: 500 }
      );
    }

    // Se a lista de jogadores estiver vazia, limpa o cache
    if (!players || players.length === 0) {
      // Limpa o cache para a rota do clube
      revalidatePath(`/web/club/${params.id}`);
      revalidatePath(`/web/dashboard`);

      return NextResponse.json({
        message: "Nenhum jogador encontrado para este clube",
        data: {
          players: [],
          count: 0,
        },
      });
    }

    return NextResponse.json({
      message: "Jogadores encontrados com sucesso",
      data: {
        players,
        count: players.length,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar jogadores:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
