class ApiResponse<T = unknown> {
  public statusCode: number;
  public success: boolean;
  public message: string;
  public data: T;

  constructor(statusCode: number, data: T, message: string = "Success") {
    this.statusCode = statusCode;
    this.success = true;
    this.message = message;
    this.data = data;
  }
}

export default ApiResponse;
