// Authentication related types
export interface SignUpDto {
  email: string;
  password: string;
  full_name?: string;
}

export interface SignInDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  user: {
    id: string;
    email: string;
    email_confirmed_at: string | null;
    created_at: string;
    updated_at: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    token_type: string;
  };
  message: string;
}

export interface RefreshTokenDto {
  refresh_token: string;
}