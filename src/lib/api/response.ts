interface ApiResponseData {
  [key: string]: unknown;
}

type ApiResponseOptions = {
  status?: number;
  headers?: HeadersInit;
};

export function apiResponse(
  data: ApiResponseData,
  options: ApiResponseOptions = {}
) {
  const { status = 200, headers = {} } = options;

  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}
