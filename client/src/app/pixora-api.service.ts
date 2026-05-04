import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import type { AuthResponse, BusinessIntake, GeneratedSite, GenerationSummary, UserAccount } from "./pixora.models";

@Injectable({ providedIn: "root" })
export class PixoraApiService {
  constructor(private readonly http: HttpClient) {}

  private get authHeaders() {
    const token = localStorage.getItem("pixora_token");
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  }

  signup(input: { name: string; email: string; password: string }) {
    return this.http.post<AuthResponse>("/api/auth/signup", input);
  }

  login(input: { email: string; password: string }) {
    return this.http.post<AuthResponse>("/api/auth/login", input);
  }

  me() {
    return this.http.get<{ user: UserAccount }>("/api/auth/me", { headers: this.authHeaders });
  }

  logout() {
    return this.http.post<void>("/api/auth/logout", {}, { headers: this.authHeaders });
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
}
