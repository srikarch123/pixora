import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import type {
  AdminGenerationSummary,
  AdminStats,
  AdminUserSummary,
  AuthResponse,
  BusinessIntake,
  CreditPackage,
  GeneratedSite,
  GenerationSummary,
  UserAccount
} from "./pixora.models";

@Injectable({ providedIn: "root" })
export class PixoraApiService {
  constructor(private readonly http: HttpClient) {}

  private get authHeaders() {
    const token = localStorage.getItem("pixora_token");
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  }

  getConfig() {
    return this.http.get<{ googleClientId: string | null }>("/api/config");
  }

  signup(input: { name: string; email: string; password: string }) {
    return this.http.post<AuthResponse>("/api/auth/signup", input);
  }

  login(input: { email: string; password: string }) {
    return this.http.post<AuthResponse>("/api/auth/login", input);
  }

  googleAuth(credential: string) {
    return this.http.post<AuthResponse>("/api/auth/google", { credential });
  }

  resendVerification() {
    return this.http.post<{ sent: boolean }>("/api/auth/resend-verification", {}, { headers: this.authHeaders });
  }

  me() {
    return this.http.get<{ user: UserAccount }>("/api/auth/me", { headers: this.authHeaders });
  }

  logout() {
    return this.http.post<void>("/api/auth/logout", {}, { headers: this.authHeaders });
  }

  listCreditPackages() {
    return this.http.get<{ packages: CreditPackage[] }>("/api/billing/credit-packages", { headers: this.authHeaders });
  }

  createCheckoutSession(packageId: string) {
    return this.http.post<{ url: string }>("/api/billing/checkout", { packageId }, { headers: this.authHeaders });
  }

  syncCheckoutSession(sessionId: string) {
    return this.http.post<{ applied: boolean; credits: number | null; status: string; message: string }>(
      "/api/billing/checkout/sync",
      { sessionId },
      { headers: this.authHeaders }
    );
  }

  generate(intake: BusinessIntake) {
    return this.http.post<GeneratedSite>("/api/generate", intake, { headers: this.authHeaders });
  }

  saveGeneration(intake: BusinessIntake, site: GeneratedSite) {
    return this.http.post<{ saved: boolean; id: string }>("/api/generations", { intake, site }, { headers: this.authHeaders });
  }

  listGenerations() {
    return this.http.get<{ generations: GenerationSummary[] }>("/api/generations", { headers: this.authHeaders });
  }

  getGeneration(id: string) {
    return this.http.get<GeneratedSite>(`/api/generations/${id}`, { headers: this.authHeaders });
  }

  deleteGeneration(id: string) {
    return this.http.delete<void>(`/api/generations/${id}`, { headers: this.authHeaders });
  }

  getAdminOverview() {
    return this.http.get<{
      stats: AdminStats;
      users: AdminUserSummary[];
      generations: AdminGenerationSummary[];
    }>("/api/admin/overview", { headers: this.authHeaders });
  }

  deleteAdminUser(id: string) {
    return this.http.delete<void>(`/api/admin/users/${id}`, { headers: this.authHeaders });
  }

  updateAdminUser(id: string, input: { emailVerified?: boolean; isAdmin?: boolean; credits?: number }) {
    return this.http.patch<{ updated: boolean }>(`/api/admin/users/${id}`, input, { headers: this.authHeaders });
  }

  listAdminUserGenerations(id: string) {
    return this.http.get<{ generations: AdminGenerationSummary[] }>(`/api/admin/users/${id}/generations`, {
      headers: this.authHeaders
    });
  }

  deleteAdminGeneration(id: string) {
    return this.http.delete<void>(`/api/admin/generations/${id}`, { headers: this.authHeaders });
  }
}
