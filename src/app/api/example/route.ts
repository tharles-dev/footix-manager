import { NextResponse } from "next/server";
import { z } from "zod";
import { validateData } from "@/lib/api/validation";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { getCachedData, setCachedData } from "@/lib/api/cache";

// Schema de validação para o corpo da requisição
const exampleSchema = z.object({
  name: z.string().min(3).max(50),
  age: z.number().min(18).max(100),
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    // Verifica rate limit
    await checkRateLimit("example-api", 10, 60); // 10 requisições por minuto

    // Obtém e valida os dados
    const body = await request.json();
    const data = validateData(exampleSchema, body);

    // Verifica cache
    const cacheKey = `example:${data.email}`;
    const cached = await getCachedData(cacheKey);

    if (cached) {
      return NextResponse.json({
        message: "Dados recuperados do cache",
        data: cached,
      });
    }

    // Simula processamento
    const result = {
      ...data,
      processedAt: new Date().toISOString(),
      random: Math.random(),
    };

    // Salva no cache por 5 minutos
    await setCachedData(cacheKey, result, 300);

    return NextResponse.json({
      message: "Dados processados com sucesso",
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
