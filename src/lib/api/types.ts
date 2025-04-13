export type ApiResponse<T = any> = {
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
};

export type ApiError = {
  message: string;
  code: string;
  details?: any;
};
