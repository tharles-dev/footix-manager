import { createClient } from "@/lib/supabase/client";
import { ApiError } from "./error";

export type ApiResponse<T> = {
  data: T;
  message?: string;
};

export type ApiErrorResponse = {
  error: string;
  message: string;
};

export class ApiService {
  protected supabase = createClient();

  protected async get<T>(
    endpoint: string,
    params?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    try {
      let query = this.supabase.from(endpoint).select("*");

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      const { data, error } = await query;

      if (error) throw new ApiError(error.message, error.code);

      return { data: data as T };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("Erro ao buscar dados", "FETCH_ERROR");
    }
  }

  protected async post<T, B = Record<string, unknown>>(
    endpoint: string,
    body: B
  ): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await this.supabase
        .from(endpoint)
        .insert(body)
        .select();

      if (error) throw new ApiError(error.message, error.code);

      return { data: data as T, message: "Operação realizada com sucesso" };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("Erro ao criar dados", "CREATE_ERROR");
    }
  }

  protected async put<T, B = Record<string, unknown>>(
    endpoint: string,
    id: string,
    body: B
  ): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await this.supabase
        .from(endpoint)
        .update(body)
        .eq("id", id)
        .select();

      if (error) throw new ApiError(error.message, error.code);

      return { data: data as T, message: "Operação atualizada com sucesso" };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("Erro ao atualizar dados", "UPDATE_ERROR");
    }
  }

  protected async delete(
    endpoint: string,
    id: string
  ): Promise<ApiResponse<null>> {
    try {
      const { error } = await this.supabase
        .from(endpoint)
        .delete()
        .eq("id", id);

      if (error) throw new ApiError(error.message, error.code);

      return { data: null, message: "Operação excluída com sucesso" };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("Erro ao excluir dados", "DELETE_ERROR");
    }
  }
}
