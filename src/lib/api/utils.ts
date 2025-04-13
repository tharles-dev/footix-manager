import { NextResponse } from "next/server";
import { ApiResponse, ApiError } from "./types";

export function apiResponse<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data });
}

export function apiError(
  error: ApiError,
  status: number = 400
): NextResponse<ApiResponse> {
  return NextResponse.json({ error }, { status });
}
