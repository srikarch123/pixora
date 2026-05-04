import { CommonModule } from "@angular/common";
import { Component, computed, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { PixoraApiService } from "./pixora-api.service";
import type {
  AuthResponse,
  BusinessIntake,
  GeneratedSite,
  GenerationSummary,
  UserAccount,
  WebsiteSection
} from "./pixora.models";

type View = "dashboard" | "generator" | "library";

const sectionOptions: Array<{ value: WebsiteSection; label: string }> = [
  { value: "hero", label: "Hero" },
  { value: "about", label: "About" },
  { value: "services", label: "Services" },
  { value: "products", label: "Products" },
  { value: "menu", label: "Menu" },
  { value: "gallery", label: "Gallery" },
  { value: "testimonials", label: "Testimonials" },
  { value: "contact", label: "Contact" }
];

const fieldLabels: Record<string, string> = {
  businessName: "Business name",
  city: "City",
  country: "Country",
  description: "Description",
  audience: "Target audience",
  colors: "Brand colors",
  offeringsText: "Offerings",
  contactEmail: "Contact email"
};

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css"
})
export class AppComponent {
  protected readonly sectionOptions = sectionOptions;
  protected readonly activeView = signal<View>("dashboard");
  protected readonly selectedFileIndex = signal(0);
  protected readonly generatedSite = signal<GeneratedSite | null>(null);
  protected readonly generations = signal<GenerationSummary[]>([]);
  protected readonly user = signal<UserAccount | null>(null);
  protected readonly authMode = signal<"signup" | "login">("signup");
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly isSaved = signal(false);
  protected readonly isMaximized = signal(false);
  protected readonly authLoading = signal(false);
  protected readonly libraryLoading = signal(false);
  protected readonly error = signal("");
  protected readonly authError = signal("");
  protected readonly currentIntake = signal<BusinessIntake | null>(null);

  protected readonly activeFile = computed(() => {
    const site = this.generatedSite();
    return site?.files[this.selectedFileIndex()] ?? null;
  });

  protected readonly previewSource = computed<SafeResourceUrl | null>(() => {
    const site = this.generatedSite();
    return site
      ? this.sanitizer.bypassSecurityTrustResourceUrl(
          `data:text/html;charset=utf-8,${encodeURIComponent(site.previewHtml)}`
        )
      : null;
  });

  protected readonly stats = computed(() => {
    const gens = this.generations();
    const latest = gens[0]?.createdAt;
    return {
      websites: gens.length,
      templates: new Set(gens.map((g) => g.templateId)).size,
      latest: latest ? new Date(latest).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"
    };
  });

  protected readonly firstNameDisplay = computed(() => {
    const name = this.user()?.name ?? "";
    return name.split(" ")[0] ?? name;
  });

  protected readonly authForm = this.fb.nonNullable.group({
    name: ["", [Validators.required, Validators.minLength(2)]],
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(8)]]
  });

  protected readonly form = this.fb.nonNullable.group({
    businessName: ["", [Validators.required, Validators.minLength(2)]],
    businessType: ["restaurant" as const, Validators.required],
    city: ["", Validators.required],
    country: ["", Validators.required],
    language: ["en" as const, Validators.required],
    description: ["", [Validators.required, Validators.minLength(20)]],
    audience: ["", Validators.required],
    brandTone: ["warm" as const, Validators.required],
    colors: ["", Validators.required],
    heroImageUrl: [""],
    galleryImageUrlsText: [""],
    sections: this.fb.nonNullable.control<WebsiteSection[]>(["hero", "about", "services", "contact"]),
    offeringsText: ["", Validators.required],
    contactEmail: ["", [Validators.required, Validators.email]],
    phone: [""],
    whatsapp: [""],
    address: [""],
    socialLinks: [""]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly api: PixoraApiService,
    private readonly sanitizer: DomSanitizer
  ) {
    if (localStorage.getItem("pixora_token")) {
      this.restoreSession();
    }
  }

  protected setView(view: View) {
    this.activeView.set(view);
    this.error.set("");
  }

  protected setAuthMode(mode: "signup" | "login") {
    this.authMode.set(mode);
    this.authError.set("");
  }

  protected submitAuth() {
    if (this.authForm.invalid) {
      this.authForm.markAllAsTouched();
      this.authError.set("Please enter a valid email and a password of at least 8 characters.");
      return;
    }
    this.authLoading.set(true);
    this.authError.set("");
    const { name, email, password } = this.authForm.getRawValue();
    const req =
      this.authMode() === "signup"
        ? this.api.signup({ name, email, password })
        : this.api.login({ email, password });

    req.subscribe({
      next: (res) => this.applyAuth(res),
      error: (err: { error?: { message?: string } }) => {
        this.authError.set(err.error?.message ?? "Authentication failed.");
        this.authLoading.set(false);
      }
    });
  }

  protected logout() {
    this.api.logout().subscribe({ error: () => undefined });
    localStorage.removeItem("pixora_token");
    this.user.set(null);
    this.generatedSite.set(null);
    this.generations.set([]);
    this.activeView.set("dashboard");
  }

  protected sectionSelected(section: WebsiteSection) {
    return this.form.controls.sections.value.includes(section);
  }

  protected toggleSection(section: WebsiteSection, checked: boolean) {
    const sections = new Set(this.form.controls.sections.value);
    checked ? sections.add(section) : sections.delete(section);
    this.form.controls.sections.setValue(Array.from(sections));
  }

  protected generateSite() {
    if (!this.user()) {
      this.error.set("Sign in to generate a website.");
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const labels = this.invalidFieldLabels();
      this.error.set(labels.length ? `Please complete: ${labels.join(", ")}.` : "Please complete all required fields.");
      return;
    }
    this.loading.set(true);
    this.error.set("");
    this.isSaved.set(false);
    this.selectedFileIndex.set(0);
    const intake = this.toIntake();
    this.currentIntake.set(intake);

    this.api.generate(intake).subscribe({
      next: (site) => {
        this.generatedSite.set(site);
        this.loading.set(false);
      },
      error: (err: { error?: { message?: string }; message?: string; status?: number }) => {
        const msg = err.error?.message ?? err.message ?? "Unknown error";
        this.error.set(`Generation failed${err.status ? ` (${err.status})` : ""}: ${msg}`);
        this.loading.set(false);
      }
    });
  }

  protected saveCurrentSite() {
    const site = this.generatedSite();
    const intake = this.currentIntake();
    if (!site || !intake || this.isSaved()) return;

    this.saving.set(true);
    this.api.saveGeneration(intake, site).subscribe({
      next: () => {
        this.isSaved.set(true);
        this.saving.set(false);
        this.loadGenerations();
      },
      error: () => {
        this.error.set("Could not save the website. Please try again.");
        this.saving.set(false);
      }
    });
  }

  protected openGeneration(id: string) {
    this.setView("generator");
    this.libraryLoading.set(true);
    this.isSaved.set(true); // already saved if loading from library
    this.currentIntake.set(null);
    this.api.getGeneration(id).subscribe({
      next: (site) => {
        this.generatedSite.set(site);
        this.selectedFileIndex.set(0);
        this.libraryLoading.set(false);
      },
      error: () => {
        this.error.set("Could not load that website.");
        this.libraryLoading.set(false);
      }
    });
  }

  private restoreSession() {
    this.authLoading.set(true);
    this.api.me().subscribe({
      next: ({ user }) => {
        this.user.set(user);
        this.authLoading.set(false);
        this.loadGenerations();
      },
      error: () => {
        localStorage.removeItem("pixora_token");
        this.authLoading.set(false);
      }
    });
  }

  private applyAuth(response: AuthResponse) {
    localStorage.setItem("pixora_token", response.token);
    this.user.set(response.user);
    this.authLoading.set(false);
    this.loadGenerations();
  }

  private loadGenerations() {
    this.libraryLoading.set(true);
    this.api.listGenerations().subscribe({
      next: ({ generations }) => {
        this.generations.set(generations);
        this.libraryLoading.set(false);
      },
      error: () => {
        this.libraryLoading.set(false);
      }
    });
  }

  private invalidFieldLabels() {
    return Object.entries(this.form.controls)
      .filter(([, ctrl]) => ctrl.invalid)
      .map(([name]) => fieldLabels[name] ?? name);
  }

  private toIntake(): BusinessIntake {
    const v = this.form.getRawValue();
    return {
      businessName: v.businessName,
      businessType: v.businessType,
      city: v.city,
      country: v.country,
      language: v.language,
      description: v.description,
      audience: v.audience,
      brandTone: v.brandTone,
      colors: v.colors,
      heroImageUrl: v.heroImageUrl || undefined,
      galleryImageUrls: v.galleryImageUrlsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      sections: v.sections,
      offerings: v.offeringsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      contactEmail: v.contactEmail,
      phone: v.phone || undefined,
      whatsapp: v.whatsapp || undefined,
      address: v.address || undefined,
      socialLinks: v.socialLinks || undefined
    };
  }
}
