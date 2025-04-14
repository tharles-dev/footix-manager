import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const serverId = params.id;
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado", message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Verificar se o usuário é administrador
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || userData?.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado", message: "Usuário não é administrador" },
        { status: 403 }
      );
    }

    // Verificar se o servidor existe
    const { data: server, error: serverError } = await supabase
      .from("servers")
      .select("id")
      .eq("id", serverId)
      .single();

    if (serverError || !server) {
      return NextResponse.json(
        { error: "Servidor não encontrado", message: "Servidor não existe" },
        { status: 404 }
      );
    }

    // Obter parâmetros de consulta
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Construir consulta base
    let query = supabase
      .from("admin_logs")
      .select("*")
      .eq("server_id", serverId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Aplicar filtro por tipo se fornecido
    if (type) {
      query = query.eq("type", type);
    }

    // Executar consulta
    const { data: logs, error: logsError } = await query;

    if (logsError) {
      console.error("Erro ao buscar logs:", logsError);
      return NextResponse.json(
        { error: "Erro interno", message: "Falha ao buscar logs" },
        { status: 500 }
      );
    }

    // Contar total de logs para paginação
    let countQuery = supabase
      .from("admin_logs")
      .select("id", { count: "exact", head: true })
      .eq("server_id", serverId);

    if (type) {
      countQuery = countQuery.eq("type", type);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error("Erro ao contar logs:", countError);
      // Não retornamos erro aqui, apenas usamos o valor padrão
    }

    return NextResponse.json({
      data: {
        logs,
        pagination: {
          total: count || 0,
          limit,
          offset,
          has_more: (count || 0) > offset + limit,
        },
      },
    });
  } catch (error) {
    console.error("Erro ao processar requisição:", error);
    return NextResponse.json(
      { error: "Erro interno", message: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}
