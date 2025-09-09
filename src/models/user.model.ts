export interface User {
  id_pengguna: number;
  username: string;
  nama_pengguna: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithoutPassword {
  id_pengguna: number;
  username: string;
  nama_pengguna: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserRequest {
  username: string;
  nama_pengguna: string;
  password: string;
}

export interface UpdateUserRequest {
  username?: string;
  nama_pengguna?: string;
  password?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserWithoutPassword;
}

export interface AuthUser {
  id_pengguna: number;
  username: string;
  nama_pengguna: string;
}
