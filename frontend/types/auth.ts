import type { User } from "./user";

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  error?: {
    code: string;
  };
}
