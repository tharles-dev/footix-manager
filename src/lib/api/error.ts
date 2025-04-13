export class ApiError extends Error {
  public readonly code: string;
  public readonly details?: unknown;

  constructor({
    message,
    code,
    details,
  }: {
    message: string;
    code: string;
    details?: unknown;
  }) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}
