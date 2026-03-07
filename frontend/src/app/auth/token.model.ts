export interface FamilyAuthResponseDto {
  accessToken: string;
  familyEmail: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

