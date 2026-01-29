class ApiError extends Error {
  public statusCode: number;
  public success: boolean;

  constructor(statusCode: number, message: string) {
    super(message);

    this.statusCode = statusCode;
    this.success = false;

    // Fix prototype chain (important in TS)
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export default ApiError;
