export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | undefined,
    message: string,
    public readonly response: Response,
  ) {
    super(message)
    this.name = 'ApiError'
  }

  static async from(response: Response): Promise<ApiError> {
    let code: string | undefined
    let message = response.statusText
    try {
      const body = (await response.clone().json()) as {
        code?: string
        message?: string
      }
      code = body.code
      if (body.message) message = body.message
    } catch {
      // body가 JSON이 아니면 statusText 유지
    }
    return new ApiError(response.status, code, message, response)
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
