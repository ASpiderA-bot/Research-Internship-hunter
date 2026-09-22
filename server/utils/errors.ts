export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_ERROR"
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof Error) {
    return new AppError(error.message, 500, "INTERNAL_ERROR");
  }
  return new AppError("An unexpected error occurred", 500, "INTERNAL_ERROR");
}

export function errorResponse(message: string, code: string = "INTERNAL_ERROR") {
  return { error: { message, code } };
}
