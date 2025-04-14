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
  protected async get<T>(
    endpoint: string,
    params?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    try {
      let url = endpoint;

      if (params) {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          queryParams.append(key, value);
        });
        const queryString = queryParams.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError({
          message: errorData.message || "Erro ao buscar dados",
          code: errorData.code || "FETCH_ERROR",
        });
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError({
        message: "Erro ao buscar dados",
        code: "FETCH_ERROR",
      });
    }
  }

  protected async post<T, B = Record<string, unknown>>(
    endpoint: string,
    body: B
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError({
          message: errorData.message || "Erro ao criar dados",
          code: errorData.code || "CREATE_ERROR",
        });
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError({
        message: "Erro ao criar dados",
        code: "CREATE_ERROR",
      });
    }
  }

  protected async put<T, B = Record<string, unknown>>(
    endpoint: string,
    id: string,
    body: B
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${endpoint}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError({
          message: errorData.message || "Erro ao atualizar dados",
          code: errorData.code || "UPDATE_ERROR",
        });
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError({
        message: "Erro ao atualizar dados",
        code: "UPDATE_ERROR",
      });
    }
  }

  protected async delete(
    endpoint: string,
    id: string
  ): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(`${endpoint}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError({
          message: errorData.message || "Erro ao excluir dados",
          code: errorData.code || "DELETE_ERROR",
        });
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError({
        message: "Erro ao excluir dados",
        code: "DELETE_ERROR",
      });
    }
  }
}
