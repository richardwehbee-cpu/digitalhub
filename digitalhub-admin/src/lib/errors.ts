export class RepositoryError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "RepositoryError";
  }
}

export class NotFoundError extends RepositoryError {
  constructor(entity: string, id: number | string) {
    super(`${entity} with id "${id}" not found.`);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends RepositoryError {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred.";
}