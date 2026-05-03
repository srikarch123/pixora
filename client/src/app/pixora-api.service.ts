import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import type { BusinessIntake, GeneratedSite } from "./pixora.models";

@Injectable({ providedIn: "root" })
export class PixoraApiService {
  constructor(private readonly http: HttpClient) {}

  generate(intake: BusinessIntake) {
    return this.http.post<GeneratedSite>("/api/generate", intake);
  }
}
