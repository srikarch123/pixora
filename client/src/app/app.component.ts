import { CommonModule } from "@angular/common";
import { Component, computed, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { PixoraApiService } from "./pixora-api.service";
import type {
  AdminGenerationSummary,
  AdminStats,
  AdminUserSummary,
  AuthResponse,
  BusinessIntake,
  CreditPackage,
  GeneratedSite,
  GenerationSummary,
  UserAccount,
  WebsiteSection
} from "./pixora.models";

type View = "dashboard" | "generator" | "library" | "admin";
const WEBSITE_GENERATION_CREDITS = 5;

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

declare const google: {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: { credential: string }) => void;
      }) => void;
      renderButton: (element: HTMLElement, config: Record<string, unknown>) => void;
    };
  };
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
  protected readonly generationCreditCost = WEBSITE_GENERATION_CREDITS;
  protected readonly activeView = signal<View>("dashboard");
  protected readonly generatedSite = signal<GeneratedSite | null>(null);
  protected readonly generations = signal<GenerationSummary[]>([]);
  protected readonly adminUsers = signal<AdminUserSummary[]>([]);
  protected readonly adminGenerations = signal<AdminGenerationSummary[]>([]);
  protected readonly adminStats = signal<AdminStats | null>(null);
  protected readonly adminUserSearch = signal("");
  protected readonly adminSiteSearch = signal("");
  protected readonly adminUserFilter = signal<"all" | "admins" | "unverified">("all");
  protected readonly selectedAdminUserId = signal<string | null>(null);
  protected readonly creditPackages = signal<CreditPackage[]>([]);
  protected readonly user = signal<UserAccount | null>(null);
  protected readonly authMode = signal<"signup" | "login">("signup");
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly isSaved = signal(false);
  protected readonly isMaximized = signal(false);
  protected readonly authLoading = signal(false);
  protected readonly libraryLoading = signal(false);
  protected readonly adminLoading = signal(false);
  protected readonly billingLoading = signal(false);
  protected readonly error = signal("");
  protected readonly authError = signal("");
  protected readonly adminError = signal("");
  protected readonly billingError = signal("");
  protected readonly billingToast = signal("");
  protected readonly currentIntake = signal<BusinessIntake | null>(null);
  protected readonly verifiedToast = signal(false);
  protected readonly showGoogleButton = signal(false);
  protected readonly resendLoading = signal(false);
  protected readonly resendSent = signal(false);

  protected readonly needsVerification = computed(() => {
    const u = this.user();
    return !!u && !u.emailVerified;
  });

  protected readonly hasVerifiedAccess = computed(() => {
    const u = this.user();
    return !!u && u.emailVerified;
  });

  protected readonly hasAdminAccess = computed(() => {
    const u = this.user();
    return !!u && u.emailVerified && u.isAdmin;
  });

  protected readonly canGenerateWithCredits = computed(() => {
    const u = this.user();
    return !!u && (u.isAdmin || u.credits >= WEBSITE_GENERATION_CREDITS);
  });

  protected readonly recommendedCreditPackage = computed(() => this.creditPackages()[1] ?? this.creditPackages()[0] ?? null);

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

  protected readonly filteredAdminUsers = computed(() => {
    const query = this.adminUserSearch().trim().toLowerCase();
    const filter = this.adminUserFilter();
    return this.adminUsers().filter((u) => {
      const matchesQuery = !query || `${u.name} ${u.email}`.toLowerCase().includes(query);
      const matchesFilter =
        filter === "all" ||
        (filter === "admins" && u.isAdmin) ||
        (filter === "unverified" && !u.emailVerified);
      return matchesQuery && matchesFilter;
    });
  });

  protected readonly filteredAdminGenerations = computed(() => {
    const query = this.adminSiteSearch().trim().toLowerCase();
    return this.adminGenerations().filter((g) => {
      if (!query) return true;
      return `${g.businessName} ${g.businessType} ${g.templateId} ${g.userName} ${g.userEmail}`.toLowerCase().includes(query);
    });
  });

  protected readonly adminSiteHeading = computed(() => {
    const selected = this.selectedAdminUserId();
    if (!selected) return "Generated websites";
    const user = this.adminUsers().find((u) => u.id === selected);
    return user ? `${user.name}'s websites` : "Generated websites";
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
    // Check for email verification success redirect
    const params = new URLSearchParams(window.location.search);
    const verified = params.get("verified");
    if (verified === "1") {
      window.history.replaceState({}, "", window.location.pathname);
      this.verifiedToast.set(true);
      setTimeout(() => this.verifiedToast.set(false), 5000);
    }
    const checkout = params.get("checkout");
    if (checkout === "success" || checkout === "cancel") {
      window.history.replaceState({}, "", window.location.pathname);
      this.billingToast.set(
        checkout === "success"
          ? "Payment complete. Your credits will appear in a moment."
          : "Checkout cancelled. No credits were purchased."
      );
      setTimeout(() => this.billingToast.set(""), 7000);
      if (checkout === "success") {
        setTimeout(() => this.refreshUserCredits(), 2000);
        setTimeout(() => this.refreshUserCredits(), 6000);
      }
    }

    if (localStorage.getItem("pixora_token")) {
      this.restoreSession();
    }

    // Fetch Google client ID and initialize GSI
    this.api.getConfig().subscribe({
      next: (config) => {
        if (config.googleClientId) {
          this.loadGoogleSignIn(config.googleClientId);
        }
      },
      error: () => undefined
    });
  }

  protected setView(view: View) {
    this.activeView.set(view);
    this.error.set("");
    this.adminError.set("");
    if (view === "admin" && this.hasAdminAccess()) {
      this.loadAdminOverview();
    }
  }

  protected setAuthMode(mode: "signup" | "login") {
    this.authMode.set(mode);
    this.authError.set("");
    const nameCtrl = this.authForm.controls.name;
    if (mode === "login") {
      nameCtrl.clearValidators();
    } else {
      nameCtrl.setValidators([Validators.required, Validators.minLength(2)]);
    }
    nameCtrl.updateValueAndValidity();
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
    this.adminUsers.set([]);
    this.adminGenerations.set([]);
    this.adminStats.set(null);
    this.creditPackages.set([]);
    this.billingError.set("");
    this.billingToast.set("");
    this.selectedAdminUserId.set(null);
    this.activeView.set("dashboard");
    setTimeout(() => this.tryRenderGoogleButton(), 100);
  }

  protected resendVerification() {
    this.resendLoading.set(true);
    this.resendSent.set(false);
    this.api.resendVerification().subscribe({
      next: () => {
        this.resendLoading.set(false);
        this.resendSent.set(true);
        setTimeout(() => this.resendSent.set(false), 6000);
      },
      error: () => {
        this.resendLoading.set(false);
      }
    });
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
      console.warn("[Pixora] Generate blocked: no signed-in user.");
      this.error.set("Sign in to generate a website.");
      return;
    }
    if (!this.canGenerateWithCredits()) {
      this.error.set(`You need ${WEBSITE_GENERATION_CREDITS} credits to generate a website.`);
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const labels = this.invalidFieldLabels();
      console.warn("[Pixora] Generate blocked: invalid form.", labels);
      this.error.set(labels.length ? `Please complete: ${labels.join(", ")}.` : "Please complete all required fields.");
      return;
    }
    this.loading.set(true);
    this.error.set("");
    this.isSaved.set(false);
    const intake = this.toIntake();
    this.currentIntake.set(intake);
    console.info("[Pixora] Generate request started.", {
      businessName: intake.businessName,
      businessType: intake.businessType,
      sections: intake.sections
    });

    this.api.generate(intake).subscribe({
      next: (site) => {
        console.info("[Pixora] Generate request completed.", {
          id: site.id,
          templateId: site.templateId,
          source: site.generationSource?.provider
        });
        this.generatedSite.set(site);
        if (typeof site.credits === "number") {
          this.user.update((u) => (u ? { ...u, credits: site.credits! } : u));
        }
        this.loading.set(false);
      },
      error: (err: { error?: { message?: string }; message?: string; status?: number }) => {
        const msg = err.error?.message ?? err.message ?? "Unknown error";
        console.error("[Pixora] Generate request failed.", err);
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
    this.isSaved.set(true);
    this.currentIntake.set(null);
    this.api.getGeneration(id).subscribe({
      next: (site) => {
        this.generatedSite.set(site);
        this.libraryLoading.set(false);
      },
      error: () => {
        this.error.set("Could not load that website.");
        this.libraryLoading.set(false);
      }
    });
  }

  protected deleteGeneration(id: string, event: Event) {
    event.stopPropagation();
    this.api.deleteGeneration(id).subscribe({
      next: () => {
        this.generations.update((gens) => gens.filter((g) => g.id !== id));
      },
      error: () => {
        this.error.set("Could not delete the website. Please try again.");
      }
    });
  }

  protected deleteAdminUser(id: string, event: Event) {
    event.stopPropagation();
    this.adminError.set("");
    this.api.deleteAdminUser(id).subscribe({
      next: () => {
        this.adminUsers.update((users) => users.filter((u) => u.id !== id));
        this.adminGenerations.update((gens) => gens.filter((g) => g.userId !== id));
        this.loadAdminOverview();
      },
      error: (err: { error?: { message?: string } }) => {
        this.adminError.set(err.error?.message ?? "Could not delete that user.");
      }
    });
  }

  protected deleteAdminGeneration(id: string, event: Event) {
    event.stopPropagation();
    this.adminError.set("");
    this.api.deleteAdminGeneration(id).subscribe({
      next: () => {
        this.adminGenerations.update((gens) => gens.filter((g) => g.id !== id));
        this.loadAdminOverview();
      },
      error: (err: { error?: { message?: string } }) => {
        this.adminError.set(err.error?.message ?? "Could not delete that website.");
      }
    });
  }

  protected updateAdminUser(id: string, input: { emailVerified?: boolean; isAdmin?: boolean; credits?: number }, event: Event) {
    event.stopPropagation();
    this.adminError.set("");
    this.api.updateAdminUser(id, input).subscribe({
      next: () => this.loadAdminOverview(),
      error: (err: { error?: { message?: string } }) => {
        this.adminError.set(err.error?.message ?? "Could not update that user.");
      }
    });
  }

  protected setAdminUserCredits(id: string, value: string, event: Event) {
    event.stopPropagation();
    const credits = Number(value);
    if (!Number.isInteger(credits) || credits < 0) {
      this.adminError.set("Credits must be a whole number greater than or equal to 0.");
      return;
    }
    this.updateAdminUser(id, { credits }, event);
  }

  protected adjustAdminUserCredits(user: AdminUserSummary, delta: number, event: Event) {
    const credits = Math.max(0, user.credits + delta);
    this.updateAdminUser(user.id, { credits }, event);
  }

  protected formatCreditPackagePrice(pack: CreditPackage) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: pack.currency.toUpperCase()
    }).format(pack.amountCents / 100);
  }

  protected buyCredits(packageId: string) {
    this.billingLoading.set(true);
    this.billingError.set("");
    this.api.createCheckoutSession(packageId).subscribe({
      next: ({ url }) => {
        window.location.href = url;
      },
      error: (err: { error?: { message?: string } }) => {
        this.billingError.set(err.error?.message ?? "Could not start checkout.");
        this.billingLoading.set(false);
      }
    });
  }

  protected viewAdminUserSites(id: string, event: Event) {
    event.stopPropagation();
    this.adminLoading.set(true);
    this.adminError.set("");
    this.selectedAdminUserId.set(id);
    this.api.listAdminUserGenerations(id).subscribe({
      next: ({ generations }) => {
        this.adminGenerations.set(generations);
        this.adminLoading.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.adminError.set(err.error?.message ?? "Could not load that user's websites.");
        this.adminLoading.set(false);
      }
    });
  }

  protected showAllAdminSites() {
    this.selectedAdminUserId.set(null);
    this.loadAdminOverview();
  }

  // ─── Google Sign-In ─────────────────────────────────────────────────────────

  private googleClientId: string | null = null;

  private loadGoogleSignIn(clientId: string) {
    this.googleClientId = clientId;
    this.showGoogleButton.set(true);

    const init = () => {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: (res: { credential: string }) => this.handleGoogleCredential(res.credential)
      });
      // Wait a tick for Angular to show the container, then render
      setTimeout(() => this.tryRenderGoogleButton(), 50);
    };

    if (typeof google !== "undefined") {
      init();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = init;
    document.head.appendChild(script);
  }

  private tryRenderGoogleButton() {
    if (!this.googleClientId) return;
    const container = document.getElementById("g_id_signin");
    if (!container) return;
    container.innerHTML = "";
    try {
      google.accounts.id.renderButton(container, {
        type: "standard",
        theme: "filled_black",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: 340
      });
    } catch {
      setTimeout(() => this.tryRenderGoogleButton(), 100);
    }
  }

  private handleGoogleCredential(credential: string) {
    this.authLoading.set(true);
    this.authError.set("");
    this.api.googleAuth(credential).subscribe({
      next: (res) => this.applyAuth(res),
      error: (err: { error?: { message?: string } }) => {
        this.authError.set(err.error?.message ?? "Google sign-in failed.");
        this.authLoading.set(false);
      }
    });
  }

  // ─── Session helpers ─────────────────────────────────────────────────────────

  private restoreSession() {
    this.authLoading.set(true);
    this.api.me().subscribe({
      next: ({ user }) => {
        this.user.set(user);
        this.authLoading.set(false);
        if (user.emailVerified) {
          this.loadGenerations();
          this.loadCreditPackages();
          if (user.isAdmin && this.activeView() === "admin") {
            this.loadAdminOverview();
          }
        }
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
    if (response.user.emailVerified) {
      this.loadGenerations();
      this.loadCreditPackages();
      if (response.user.isAdmin && this.activeView() === "admin") {
        this.loadAdminOverview();
      }
    }
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

  private loadCreditPackages() {
    const user = this.user();
    if (!user?.emailVerified || user.isAdmin) return;
    this.api.listCreditPackages().subscribe({
      next: ({ packages }) => this.creditPackages.set(packages),
      error: () => undefined
    });
  }

  private refreshUserCredits() {
    if (!localStorage.getItem("pixora_token")) return;
    this.api.me().subscribe({
      next: ({ user }) => {
        this.user.set(user);
        this.loadCreditPackages();
      },
      error: () => undefined
    });
  }

  private loadAdminOverview() {
    if (!this.hasAdminAccess()) return;
    this.adminLoading.set(true);
    this.adminError.set("");
    this.api.getAdminOverview().subscribe({
      next: ({ stats, users, generations }) => {
        this.adminStats.set(stats);
        this.adminUsers.set(users);
        this.adminGenerations.set(generations);
        this.selectedAdminUserId.set(null);
        this.adminLoading.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.adminError.set(err.error?.message ?? "Could not load admin dashboard.");
        this.adminLoading.set(false);
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
