import { BaseApiService, httpClient } from "@/src/core/api";
import { tokenStorage } from "@/src/core/auth/token-storage";
import type { AuthUser, LoginPayload, LoginResponse, RegisterPayload } from "../types/auth";

export class AuthService extends BaseApiService {
  constructor() {
    super(httpClient, "/auth");
  }

  async login(payload: LoginPayload): Promise<AuthUser> {
    const session = await this.post<LoginResponse>("login", payload, { skipAuth: true });
    tokenStorage.setSession(session.accessToken, session.refreshToken, session.user);
    return session.user;
  }

  async register(payload: RegisterPayload): Promise<AuthUser> {
    await this.post<AuthUser>("register", payload, { skipAuth: true });
    return this.login({
      identifier: payload.email || payload.phone,
      password: payload.password,
    });
  }

  async logout(): Promise<void> {
    try {
      await this.post("logout");
    } finally {
      tokenStorage.clear();
    }
  }
}

export const authService = new AuthService();
