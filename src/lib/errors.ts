export const API_ERRORS = {
  INVALID_INPUT: { status: 400, message: "Invalid input" },
  INVALID_URL: { status: 400, message: "Invalid URL" },
  INVALID_PLAN: { status: 400, message: "Invalid plan" },
  INVALID_SIGNATURE: { status: 400, message: "Invalid signature" },
  UNAUTHORIZED: { status: 401, message: "Authentication required" },
  CREDITS_EXHAUSTED: { status: 402, message: "No credits remaining" },
  EMAIL_IN_USE: { status: 409, message: "An account with this email already exists" },
  RATE_LIMITED: { status: 429, message: "Too many requests" },
  REPO_NOT_FOUND: { status: 404, message: "Repository does not exist or is private" },
  BRANCH_NOT_FOUND: { status: 404, message: "Branch not found" },
  PAYMENT_NOT_FOUND: { status: 404, message: "Payment record not found" },
  ANALYSIS_FAILED: { status: 500, message: "Analysis failed" },
  SIGNUP_FAILED: { status: 500, message: "Could not create account" },
  HEALTH_CHECK_FAILED: { status: 500, message: "Health check failed" },
  CLONE_FAILED: { status: 500, message: "Failed to clone repository" },
  CLONE_TIMEOUT: { status: 504, message: "Clone operation timed out" },
  TIMEOUT: { status: 504, message: "Operation timed out" },
} as const;

export type ApiErrorCode = keyof typeof API_ERRORS;

export interface ApiErrorShape {
  code: ApiErrorCode;
  message: string;
  status: number;
}

export function getApiError(code: ApiErrorCode, message?: string): ApiErrorShape {
  const base = API_ERRORS[code];

  return {
    code,
    message: message ?? base.message,
    status: base.status,
  };
}
