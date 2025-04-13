import { z } from "zod";
import { ApiError } from "./error";

export function validateData<T>(schema: z.Schema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError({
        message: "Dados inválidos",
        code: "VALIDATION_ERROR",
        details: error.errors,
      });
    }
    throw error;
  }
}

export function validateQuery<T>(
  schema: z.Schema<T>,
  query: Record<string, string | string[]>
): T {
  const parsedQuery: Record<string, string> = {};

  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      parsedQuery[key] = value[0];
    } else {
      parsedQuery[key] = value;
    }
  }

  return validateData(schema, parsedQuery);
}
