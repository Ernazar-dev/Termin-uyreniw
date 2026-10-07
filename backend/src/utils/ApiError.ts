export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message = 'Qáte soraw', details?: unknown) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Akkauntıńızǵa kiriń') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Bul ámelge ruqsat joq') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Maǵlıwmat tabılmadı') {
    return new ApiError(404, message);
  }

  static conflict(message: string) {
    return new ApiError(409, message);
  }
}
