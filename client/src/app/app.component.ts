import { CommonModule } from "@angular/common";
import { Component, computed, signal } from "@angular/core";
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { PixoraApiService } from "./pixora-api.service";
import type { BusinessIntake, GeneratedSite, WebsiteSection } from "./pixora.models";

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

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css"
})
export class AppComponent {
  protected readonly sectionOptions = sectionOptions;
  protected readonly selectedFileIndex = signal(0);
  protected readonly generatedSite = signal<GeneratedSite | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal("");

  protected readonly activeFile = computed(() => {
    const site = this.generatedSite();
    return site?.files[this.selectedFileIndex()] ?? null;
  });

  protected readonly previewSource = computed<SafeResourceUrl | null>(() => {
    const site = this.generatedSite();
    if (!site) {
      return null;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `data:text/html;charset=utf-8,${encodeURIComponent(site.previewHtml)}`
    );
  });

  protected readonly form = this.fb.nonNullable.group({
    businessName: ["Cafe Aurora", [Validators.required, Validators.minLength(2)]],
    businessType: ["restaurant" as const, Validators.required],
    city: ["Medellin", Validators.required],
    country: ["Colombia", Validators.required],
    language: ["es" as const, Validators.required],
    description: [
      "A neighborhood cafe serving specialty coffee, fresh pastries, breakfast plates, and a calm space for people to meet or work.",
      [Validators.required, Validators.minLength(20)]
    ],
    audience: ["local residents, students, remote workers, and visitors", Validators.required],
    brandTone: ["warm" as const, Validators.required],
    colors: ["#315c48, #e6b85c", Validators.required],
    heroImageUrl: [""],
    galleryImageUrlsText: [""],
    sections: this.fb.nonNullable.control<WebsiteSection[]>(["hero", "about", "menu", "testimonials", "contact"]),
    offeringsText: ["Specialty coffee\nBreakfast plates\nFresh pastries\nCatering for small meetings", Validators.required],
    contactEmail: ["hello@cafeaurora.co", [Validators.required, Validators.email]],
    phone: ["+57 300 000 0000"],
    whatsapp: ["+57 300 000 0000"],
    address: ["Carrera 45, Medellin"],
    socialLinks: ["Instagram: @cafeaurora"]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly api: PixoraApiService,
    private readonly sanitizer: DomSanitizer
  ) {}

  protected sectionSelected(section: WebsiteSection) {
    return this.form.controls.sections.value.includes(section);
  }

  protected toggleSection(section: WebsiteSection, checked: boolean) {
    const sections = new Set(this.form.controls.sections.value);
    if (checked) {
      sections.add(section);
    } else {
      sections.delete(section);
    }

    this.form.controls.sections.setValue(Array.from(sections));
  }

  protected generateSite() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set("");
    this.selectedFileIndex.set(0);

    this.api.generate(this.toIntake()).subscribe({
      next: (site) => {
        this.generatedSite.set(site);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        console.error(error);
        this.error.set("The generator could not complete. Check that the API server is running.");
        this.loading.set(false);
      }
    });
  }

  private toIntake(): BusinessIntake {
    const value = this.form.getRawValue();

    return {
      businessName: value.businessName,
      businessType: value.businessType,
      city: value.city,
      country: value.country,
      language: value.language,
      description: value.description,
      audience: value.audience,
      brandTone: value.brandTone,
      colors: value.colors,
      heroImageUrl: value.heroImageUrl,
      galleryImageUrls: value.galleryImageUrlsText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      sections: value.sections,
      offerings: value.offeringsText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      contactEmail: value.contactEmail,
      phone: value.phone,
      whatsapp: value.whatsapp,
      address: value.address,
      socialLinks: value.socialLinks
    };
  }
}
