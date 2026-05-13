import { CommonModule } from "@angular/common";
import { Component, computed, effect, signal, ViewChild, ElementRef } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { PixoraApiService, type DomainSuggestion, type GenerationDeployment } from "./pixora-api.service";
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

type View = "dashboard" | "generator" | "library" | "domains" | "admin";
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
  protected readonly deployment = signal<GenerationDeployment | null>(null);
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
  protected readonly deploymentError = signal("");
  protected readonly currentIntake = signal<BusinessIntake | null>(null);
  protected readonly verifiedToast = signal(false);
  protected readonly showGoogleButton = signal(false);
  protected readonly resendLoading = signal(false);
  protected readonly resendSent = signal(false);
  protected readonly deploymentLoading = signal(false);
  protected readonly customDomainDraft = signal("");
  protected readonly hostingProviderDraft = signal<GenerationSummary["hostingProvider"]>("pixora-local");
  protected readonly domainQuery = signal("");
  protected readonly domainSuggestions = signal<DomainSuggestion[]>([]);
  protected readonly domainSearchLoading = signal(false);
  protected readonly domainCheckoutLoading = signal(false);
  protected readonly domainDeployLoading = signal(false);
  protected readonly publishLoading = signal(false);
  protected readonly copied = signal(false);
  protected readonly domainError = signal("");
  protected readonly domainYears = signal(1);
  protected readonly domainAutoRenew = signal(true);
  protected readonly selectedDomainGenerationId = signal("");
  protected readonly showBuyDomainModal = signal(false);
  protected readonly connectDomainInput = signal("");
  protected readonly connectDomainLoading = signal(false);
  protected readonly connectDomainError = signal("");
  protected readonly connectDomainResult = signal<{ cname: string; domain: string } | null>(null);

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

  protected readonly domainTargetGeneration = computed(() => {
    const id = this.selectedDomainGenerationId();
    return this.generations().find((g) => g.id === id) ?? this.generations()[0] ?? null;
  });

  protected readonly isEditMode = signal(false);
  protected readonly generateMode = signal<"form" | "upload">("form");
  protected readonly uploadFile = signal<File | null>(null);
  protected readonly uploadDragOver = signal(false);

  @ViewChild("previewIframe") private previewIframeRef?: ElementRef<HTMLIFrameElement>;

  // Plain string — no Angular sanitization involved for the main editable iframe
  protected readonly previewHtmlStr = computed<string | null>(() => {
    const site = this.generatedSite();
    if (!site) return null;
    const html = this.isEditMode() ? this.injectEditScript(site.previewHtml) : site.previewHtml;
    return this.injectNavBlock(html);
  });

  // SafeHtml only for the read-only fullscreen overlay
  protected readonly previewSrcdoc = computed<SafeHtml | null>(() => {
    const site = this.generatedSite();
    if (!site) return null;
    return this.sanitizer.bypassSecurityTrustHtml(this.injectNavBlock(site.previewHtml));
  });


  private injectNavBlock(html: string): string {
    const script = `<script data-pixora-preview>
(function(){
  document.addEventListener('click',function(e){
    if(e.target.closest('a')){e.preventDefault();}
  },true);
  document.addEventListener('submit',function(e){e.preventDefault();},true);
})();
<\/script>`;
    return html.replace("</body>", script + "\n</body>");
  }

  private injectEditScript(html: string): string {
    const css = `<style data-pixora-editor>
#pe-tb{position:fixed;top:0;left:0;right:0;z-index:2147483647;display:flex;align-items:center;gap:10px;padding:7px 14px;background:rgba(10,10,12,.95);backdrop-filter:blur(12px);font-family:system-ui,sans-serif;font-size:12px;box-shadow:0 2px 20px rgba(0,0,0,.5);border-bottom:1px solid rgba(255,255,255,.07);}
#pe-tb .pe-hint{flex:1;color:rgba(255,255,255,.55);font-size:11px;}
#pe-tb .pe-hint b{color:rgba(255,255,255,.9);}
#pe-tb .pe-grp{display:flex;align-items:center;gap:5px;}
#pe-tb .pe-lbl{color:rgba(255,255,255,.4);font-size:10px;text-transform:uppercase;letter-spacing:.05em;}
#pe-tb input[type=color]{width:26px;height:26px;padding:0;border:1px solid rgba(255,255,255,.18);border-radius:5px;cursor:pointer;background:none;}
#pe-fmt{position:fixed;z-index:2147483647;display:none;align-items:center;gap:2px;padding:4px 6px;background:rgba(10,10,12,.97);backdrop-filter:blur(12px);border-radius:9px;box-shadow:0 6px 24px rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.1);font-family:system-ui,sans-serif;transform:translateX(-50%);}
#pe-fmt button{min-width:26px;height:26px;padding:0 5px;border:none;background:transparent;color:rgba(255,255,255,.75);font-size:12px;font-weight:700;border-radius:4px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .12s;}
#pe-fmt button:hover{background:rgba(255,255,255,.14);color:#fff;}
#pe-fmt select{height:24px;padding:0 4px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:4px;color:#fff;font-size:11px;cursor:pointer;outline:none;}
#pe-fmt select option{background:#1a1a1e;}
#pe-fmt .ps{width:1px;height:16px;background:rgba(255,255,255,.14);margin:0 3px;flex-shrink:0;}
#pe-fmt input[type=color]{width:24px;height:24px;padding:0;border:1px solid rgba(255,255,255,.18);border-radius:4px;cursor:pointer;background:none;}
[data-pe]:hover{outline:2px dashed rgba(99,102,241,.5)!important;cursor:text!important;}
[data-pe]:focus{outline:2px solid rgba(99,102,241,.8)!important;outline-offset:2px!important;background:rgba(99,102,241,.05)!important;}
</style>`;

    const js = `<script data-pixora-editor>
(function(){
  function hex(c){var x=document.createElement('canvas').getContext('2d');x.fillStyle=c;return x.fillStyle;}
  var rs=getComputedStyle(document.documentElement),ds=document.documentElement.style;
  var p0=hex(ds.getPropertyValue('--primary').trim()||rs.getPropertyValue('--primary').trim()||'#6366f1');
  var a0=hex(ds.getPropertyValue('--accent').trim()||rs.getPropertyValue('--accent').trim()||'#a855f7');

  /* ── Brand toolbar ── */
  var tb=document.createElement('div');tb.id='pe-tb';tb.setAttribute('data-pixora-editor','');
  tb.innerHTML='<span class="pe-hint"><b>Edit mode</b> &mdash; click any text to edit &nbsp;&bull;&nbsp; select text for formatting options</span>'
    +'<span class="pe-grp"><span class="pe-lbl">Primary</span><input type="color" id="pe-c1" value="'+p0+'"></span>'
    +'<span class="pe-grp"><span class="pe-lbl">Accent</span><input type="color" id="pe-c2" value="'+a0+'"></span>';
  document.body.prepend(tb);
  document.getElementById('pe-c1').addEventListener('input',function(e){ds.setProperty('--primary',e.target.value);});
  document.getElementById('pe-c2').addEventListener('input',function(e){ds.setProperty('--accent',e.target.value);});

  /* ── Format toolbar ── */
  var fmt=document.createElement('div');fmt.id='pe-fmt';fmt.setAttribute('data-pixora-editor','');
  fmt.innerHTML=
    '<button data-cmd="bold" title="Bold"><b>B</b></button>'
    +'<button data-cmd="italic" title="Italic"><i>I</i></button>'
    +'<button data-cmd="underline" title="Underline"><u>U</u></button>'
    +'<button data-cmd="strikeThrough" title="Strikethrough"><s>S</s></button>'
    +'<span class="ps"></span>'
    +'<select id="pe-ff" title="Font"><option value="">Font</option>'
    +'<option value="inherit">Default</option>'
    +'<option value="Georgia">Georgia</option>'
    +'<option value="Playfair Display">Playfair Display</option>'
    +'<option value="Arial">Arial</option>'
    +'<option value="Helvetica Neue">Helvetica Neue</option>'
    +'<option value="Verdana">Verdana</option>'
    +'<option value="Courier New">Courier New</option>'
    +'<option value="Times New Roman">Times New Roman</option></select>'
    +'<select id="pe-fs" title="Size"><option value="">Size</option>'
    +'<option value="11px">11</option><option value="13px">13</option>'
    +'<option value="15px">15</option><option value="17px">17</option>'
    +'<option value="20px">20</option><option value="24px">24</option>'
    +'<option value="28px">28</option><option value="32px">32</option>'
    +'<option value="40px">40</option><option value="48px">48</option>'
    +'<option value="64px">64</option></select>'
    +'<span class="ps"></span>'
    +'<button data-cmd="justifyLeft" title="Align left">&#8676;L</button>'
    +'<button data-cmd="justifyCenter" title="Align center">C&#8212;</button>'
    +'<button data-cmd="justifyRight" title="Align right">R&#8677;</button>'
    +'<span class="ps"></span>'
    +'<input type="color" id="pe-tc" value="#000000" title="Text colour">';
  document.body.appendChild(fmt);

  var saved=null;
  function saveSel(){var s=window.getSelection();if(s&&s.rangeCount&&!s.isCollapsed){saved=s.getRangeAt(0).cloneRange();return true;}return false;}
  function restSel(){if(!saved)return;var s=window.getSelection();s.removeAllRanges();s.addRange(saved);}

  document.addEventListener('selectionchange',function(){
    var s=window.getSelection();
    if(s&&s.rangeCount&&!s.isCollapsed&&s.toString().trim()&&!fmt.contains(document.activeElement)){
      saved=s.getRangeAt(0).cloneRange();
      var r=saved.getBoundingClientRect();
      fmt.style.display='flex';
      var top=r.top-50; if(top<52)top=r.bottom+8;
      fmt.style.top=top+'px';
      fmt.style.left=Math.max(90,Math.min(r.left+r.width/2,window.innerWidth-180))+'px';
    } else if(!fmt.contains(document.activeElement)){
      fmt.style.display='none';
    }
  });
  fmt.addEventListener('mousedown',function(e){e.preventDefault();});
  fmt.querySelectorAll('[data-cmd]').forEach(function(b){
    b.addEventListener('click',function(){restSel();document.execCommand(b.getAttribute('data-cmd'),false,null);saveSel();});
  });
  function bindSelect(id,fn){
    var el=document.getElementById(id);
    el.addEventListener('mousedown',function(){saveSel();});
    el.addEventListener('change',function(e){if(!e.target.value)return;fn(e.target.value);e.target.value='';saveSel();});
  }
  bindSelect('pe-ff',function(v){restSel();document.execCommand('fontName',false,v);});
  bindSelect('pe-fs',function(v){
    restSel();document.execCommand('fontSize',false,'7');
    document.querySelectorAll('font[size="7"]').forEach(function(el){el.removeAttribute('size');el.style.fontSize=v;});
  });
  document.getElementById('pe-tc').addEventListener('mousedown',function(){saveSel();});
  document.getElementById('pe-tc').addEventListener('input',function(e){restSel();document.execCommand('foreColor',false,e.target.value);});

  /* ── Contenteditable on text nodes ── */
  document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,a,button,span,td,th,caption,figcaption,blockquote,label,dt,dd,strong,em').forEach(function(el){
    if(el.closest('#pe-tb')||el.closest('#pe-fmt'))return;
    el.setAttribute('contenteditable','true');el.setAttribute('data-pe','');
  });
  document.querySelectorAll('a[href]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();});});

}());
<\/script>`;
    return html.replace("</body>", css + "\n" + js + "\n</body>");
  }

  protected loadSampleData(): void {
    this.form.patchValue({
      businessName: "La Bella Cucina",
      businessType: "restaurant",
      city: "New York",
      country: "United States",
      language: "en",
      description:
        "A cozy Neapolitan trattoria in the heart of Little Italy serving wood-fired pizzas, hand-made pastas, and seasonal Italian dishes crafted from locally sourced ingredients. Warm atmosphere, attentive service, and a wine list curated by our sommelier.",
      audience: "Food lovers, couples on date nights, and families seeking an authentic Italian dining experience",
      brandTone: "warm",
      colors: "#c8102e, #f5f0e8",
      sections: ["hero", "about", "menu", "gallery", "testimonials", "contact"],
      offeringsText:
        "Margherita Verace: San Marzano tomato, buffalo mozzarella, fresh basil, extra virgin olive oil – $18\nTagliatelle al Ragù: Slow-braised beef ragù, house-made tagliatelle, aged Parmigiano – $24\nTiramisu della Casa: Classic espresso-soaked ladyfingers, mascarpone cream, dark cocoa – $11\nBrunch Menu: Weekends 11 am – 3 pm",
      contactEmail: "ciao@labellacucina.com",
      phone: "+1 (212) 555-0192",
      address: "123 Mulberry Street, Little Italy, New York, NY 10013",
      socialLinks: "instagram.com/labellacucina",
      heroImageUrl: "",
      galleryImageUrlsText: "",
      whatsapp: ""
    });
    this.setView("generator");
  }

  protected toggleEditMode(): void {
    if (this.isEditMode()) {
      const iframe =
        this.previewIframeRef?.nativeElement ??
        document.querySelector<HTMLIFrameElement>(".preview-viewport iframe");
      const doc = iframe?.contentDocument;
      if (doc) {
        doc.querySelectorAll("[data-pixora-editor]").forEach((el) => el.remove());
        doc.querySelectorAll("[contenteditable]").forEach((el) => {
          el.removeAttribute("contenteditable");
          el.removeAttribute("data-pe");
        });
        const updatedHtml = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
        const site = this.generatedSite();
        if (site) {
          this.generatedSite.set({ ...site, previewHtml: updatedHtml });
          this.isSaved.set(false);
          this.deployment.set(null);
        }
      }
      this.isEditMode.set(false);
    } else {
      this.isEditMode.set(true);
    }
  }

  protected downloadSite(): void {
    const site = this.generatedSite();
    if (!site) return;
    const name = (this.currentIntake()?.businessName ?? "website").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const blob = new Blob([site.previewHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name + ".html";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  protected deleteCurrentSite(): void {
    const site = this.generatedSite();
    if (!site || !this.isSaved()) return;
    if (!confirm("Delete this website from your library?")) return;
    this.api.deleteGeneration(site.id).subscribe({
      next: () => {
        this.generatedSite.set(null);
        this.deployment.set(null);
        this.currentIntake.set(null);
        this.isSaved.set(false);
        this.isEditMode.set(false);
        this.loadGenerations();
      },
      error: () => this.error.set("Could not delete the website. Please try again.")
    });
  }

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

  protected readonly domainSuggestionChips = computed(() => {
    const gen = this.domainTargetGeneration();
    if (!gen) return [];
    const base = gen.businessName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 20) || "mysite";
    return [`${base}.com`, `${base}.dev`, `${base}.io`, `${base}.app`];
  });

  protected readonly pagesUrlForTargetGen = computed(() => {
    const gen = this.domainTargetGeneration();
    if (!gen || gen.hostingProvider !== "cloudflare-pages") return null;
    return `https://px-${gen.id.replace(/-/g, "").slice(0, 20)}.pages.dev`;
  });

  protected readonly pagesUrl = computed(() => {
    const d = this.deployment();
    return d?.hostActionUrl ?? null;
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
    // Write HTML directly to the iframe so scripts execute (bypasses Angular's [srcdoc] sanitization)
    effect(() => {
      const html = this.previewHtmlStr();
      queueMicrotask(() => {
        const iframe =
          this.previewIframeRef?.nativeElement ??
          document.querySelector<HTMLIFrameElement>(".preview-viewport iframe");
        if (!iframe || !html) return;
        iframe.srcdoc = html;
      });
    });
    // Check for email verification success redirect
    const params = new URLSearchParams(window.location.search);
    const verified = params.get("verified");
    if (verified === "1") {
      window.history.replaceState({}, "", window.location.pathname);
      this.verifiedToast.set(true);
      setTimeout(() => this.verifiedToast.set(false), 5000);
    }
    const checkout = params.get("checkout");
    const checkoutSessionId = params.get("session_id");
    const domainCheckout = params.get("domain_checkout");
    const domainName = params.get("domain");
    if (domainCheckout === "success" || domainCheckout === "cancel") {
      window.history.replaceState({}, "", window.location.pathname);
      if (domainCheckout === "cancel") {
        this.billingToast.set("Domain checkout cancelled.");
        setTimeout(() => this.billingToast.set(""), 7000);
      } else {
        const sessionId = params.get("session_id");
        if (sessionId) {
          this.billingToast.set(`Payment confirmed${domainName ? ` for ${domainName}` : ""}. Deploying your website now…`);
          this.syncDomainCheckoutReturn(sessionId);
        } else {
          this.billingToast.set(`Domain checkout complete${domainName ? ` for ${domainName}` : ""}. Your site will be live shortly.`);
          setTimeout(() => this.billingToast.set(""), 7000);
        }
      }
    }
    if (checkout === "success" || checkout === "cancel") {
      window.history.replaceState({}, "", window.location.pathname);
      this.billingToast.set(
        checkout === "success"
          ? "Payment complete. Adding your credits now."
          : "Checkout cancelled. No credits were purchased."
      );
      setTimeout(() => this.billingToast.set(""), 7000);
      if (checkout === "success") {
        if (checkoutSessionId) {
          this.syncCheckoutReturn(checkoutSessionId);
        } else {
          setTimeout(() => this.refreshUserCredits(), 2000);
          setTimeout(() => this.refreshUserCredits(), 6000);
        }
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
    if (view === "domains" && !this.generations().length) {
      this.loadGenerations();
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
    this.deployment.set(null);
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
    this.isEditMode.set(false);
    this.deployment.set(null);
    this.deploymentError.set("");
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
        this.deployment.set(null);
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

  protected setGenerateMode(mode: "form" | "upload") {
    this.generateMode.set(mode);
    this.uploadFile.set(null);
    this.error.set("");
  }

  protected onUploadFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.uploadFile.set(file);
    this.error.set("");
  }

  protected onUploadDrop(event: DragEvent) {
    event.preventDefault();
    this.uploadDragOver.set(false);
    const file = event.dataTransfer?.files[0] ?? null;
    if (file) this.uploadFile.set(file);
    this.error.set("");
  }

  protected generateFromFile() {
    const file = this.uploadFile();
    if (!file) {
      this.error.set("Please select a file first.");
      return;
    }
    if (!this.canGenerateWithCredits()) {
      this.error.set(`You need ${WEBSITE_GENERATION_CREDITS} credits to generate a website.`);
      return;
    }
    this.loading.set(true);
    this.error.set("");
    this.isSaved.set(false);
    this.isEditMode.set(false);
    this.deployment.set(null);
    this.deploymentError.set("");

    this.api.generateFromFile(file).subscribe({
      next: (site) => {
        this.generatedSite.set(site);
        this.currentIntake.set(site.extractedIntake ?? null);
        this.deployment.set(null);
        if (typeof site.credits === "number") {
          this.user.update((u) => (u ? { ...u, credits: site.credits! } : u));
        }
        this.loading.set(false);
      },
      error: (err: { error?: { message?: string }; status?: number }) => {
        this.error.set(err.error?.message ?? "Could not generate from file. Please try again.");
        this.loading.set(false);
      }
    });
  }

  protected publishSite() {
    const site = this.generatedSite();
    const intake = this.currentIntake();
    if (!site || !intake) return;

    this.publishLoading.set(true);
    this.deploymentError.set("");

    if (!this.isSaved()) {
      // First publish: save to DB + deploy to Pages
      this.api.saveGeneration(intake, site).subscribe({
        next: ({ deployment }) => {
          this.isSaved.set(true);
          this.deployment.set(deployment);
          this.customDomainDraft.set(deployment.customDomain ?? "");
          this.hostingProviderDraft.set(deployment.hostingProvider);
          this.publishLoading.set(false);
          this.loadGenerations();
        },
        error: () => {
          this.deploymentError.set("Could not publish. Please try again.");
          this.publishLoading.set(false);
        }
      });
    } else {
      // Re-publish: re-deploy existing saved site to Pages
      this.api.publishGeneration(site.id).subscribe({
        next: ({ deployment }) => {
          this.deployment.set(deployment);
          this.publishLoading.set(false);
          this.loadGenerations();
        },
        error: (err: { error?: { message?: string } }) => {
          this.deploymentError.set(err.error?.message ?? "Could not re-publish. Please try again.");
          this.publishLoading.set(false);
        }
      });
    }
  }

  protected copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  protected openGeneration(id: string) {
    this.setView("generator");
    this.libraryLoading.set(true);
    this.isSaved.set(true);
    this.isEditMode.set(false);
    this.currentIntake.set(null);
    this.deployment.set(null);
    this.api.getGeneration(id).subscribe({
      next: ({ site, intake, deployment }) => {
        this.generatedSite.set(site);
        this.currentIntake.set(intake);
        this.deployment.set(deployment);
        this.customDomainDraft.set(deployment?.customDomain ?? "");
        this.hostingProviderDraft.set(deployment?.hostingProvider ?? "pixora-local");
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

  protected openPublishedSite() {
    const url = this.deployment()?.customDomainUrl ?? this.deployment()?.publicUrl;
    if (url) {
      window.location.assign(url);
    }
  }

  protected updateDeploymentSettings(openHost = false) {
    const site = this.generatedSite();
    if (!site || !this.isSaved()) {
      this.deploymentError.set("Save this website before publishing deployment settings.");
      return;
    }
    this.deploymentLoading.set(true);
    this.deploymentError.set("");
    this.api
      .updateGenerationDeployment(site.id, {
        customDomain: this.customDomainDraft(),
        hostingProvider: this.hostingProviderDraft()
      })
      .subscribe({
        next: ({ deployment }) => {
          this.deployment.set(deployment);
          this.customDomainDraft.set(deployment.customDomain ?? "");
          this.hostingProviderDraft.set(deployment.hostingProvider);
          this.deploymentLoading.set(false);
          this.loadGenerations();
          if (openHost) {
            window.location.assign(deployment.hostActionUrl);
          }
        },
        error: (err: { error?: { message?: string } }) => {
          this.deploymentError.set(err.error?.message ?? "Could not update deployment settings.");
          this.deploymentLoading.set(false);
        }
      });
  }

  protected continueToSelectedHost() {
    this.updateDeploymentSettings(true);
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

  protected formatDomainPrice(suggestion: DomainSuggestion) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: suggestion.currency.toUpperCase()
    }).format((suggestion.priceCents * this.domainYears()) / 100);
  }

  protected formatRenewalPrice(suggestion: DomainSuggestion) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: suggestion.currency.toUpperCase()
    }).format(suggestion.renewalPriceCents / 100);
  }

  protected openBuyModal(preloadQuery?: string) {
    if (preloadQuery) {
      this.domainQuery.set(preloadQuery);
    }
    this.showBuyDomainModal.set(true);
    if (preloadQuery) {
      setTimeout(() => this.searchDomainOptions(), 0);
    }
  }

  protected closeBuyModal() {
    this.showBuyDomainModal.set(false);
    this.domainSuggestions.set([]);
    this.domainError.set("");
  }

  protected selectDomainChip(chip: string) {
    this.openBuyModal(chip);
  }

  protected connectDomain() {
    const domain = this.connectDomainInput().trim();
    const generation = this.domainTargetGeneration();
    if (!domain) {
      this.connectDomainError.set("Enter a domain name.");
      return;
    }
    if (!generation) {
      this.connectDomainError.set("Publish a website first.");
      return;
    }
    this.connectDomainLoading.set(true);
    this.connectDomainError.set("");
    this.connectDomainResult.set(null);
    this.api.connectExistingDomain(generation.id, domain).subscribe({
      next: ({ cname, domain: connectedDomain, deployment }) => {
        this.connectDomainResult.set({ cname, domain: connectedDomain });
        if (deployment) {
          this.deployment.set(deployment);
          this.loadGenerations();
        }
        this.connectDomainLoading.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.connectDomainError.set(err.error?.message ?? "Could not connect domain. Please try again.");
        this.connectDomainLoading.set(false);
      }
    });
  }

  protected searchDomainOptions(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    const query = this.domainQuery().trim();
    if (query.length < 2) {
      this.domainError.set("Enter at least 2 characters to search domains.");
      return;
    }
    this.domainSearchLoading.set(true);
    this.domainError.set("");
    this.api.searchDomains(query).subscribe({
      next: ({ suggestions }) => {
        this.domainSuggestions.set(suggestions);
        this.domainSearchLoading.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.domainError.set(err.error?.message ?? "Could not search domains.");
        this.domainSearchLoading.set(false);
      }
    });
  }

  protected buyDomain(suggestion: DomainSuggestion) {
    const generation = this.domainTargetGeneration();
    if (!generation) {
      this.domainError.set("Save a website before buying a domain.");
      return;
    }
    if (!suggestion.available) {
      this.domainError.set(`${suggestion.domain} is not available.`);
      return;
    }
    this.domainCheckoutLoading.set(true);
    this.domainError.set("");
    this.api
      .createDomainCheckout({
        domain: suggestion.domain,
        generationId: generation.id,
        years: this.domainYears(),
        autoRenew: this.domainAutoRenew()
      })
      .subscribe({
        next: ({ url }) => {
          window.location.assign(url);
        },
        error: (err: { error?: { message?: string } }) => {
          this.domainError.set(err.error?.message ?? "Could not start domain checkout.");
          this.domainCheckoutLoading.set(false);
        }
      });
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

  private syncDomainCheckoutReturn(sessionId: string) {
    this.domainDeployLoading.set(true);
    this.api.syncDomainCheckout(sessionId).subscribe({
      next: ({ deployed, pagesUrl, domain, deployment }) => {
        this.domainDeployLoading.set(false);
        if (deployed && pagesUrl) {
          const domainMsg = domain ? ` Your domain ${domain} will point to it once DNS propagates.` : "";
          this.billingToast.set(`Website deployed to Cloudflare Pages.${domainMsg}`);
          if (deployment) {
            this.deployment.set(deployment);
            this.isSaved.set(true);
            this.loadGenerations();
          }
        } else {
          this.billingToast.set("Payment received. Your site will deploy automatically once Stripe confirms.");
        }
        setTimeout(() => this.billingToast.set(""), 10000);
      },
      error: (err: { error?: { message?: string } }) => {
        this.domainDeployLoading.set(false);
        this.billingToast.set(
          err.error?.message ?? "Payment received but deployment is still in progress. Check back in a moment."
        );
        setTimeout(() => this.billingToast.set(""), 10000);
      }
    });
  }

  private syncCheckoutReturn(sessionId: string) {
    this.billingLoading.set(true);
    this.billingError.set("");
    this.api.syncCheckoutSession(sessionId).subscribe({
      next: ({ credits, status }) => {
        if (typeof credits === "number") {
          this.user.update((u) => (u ? { ...u, credits } : u));
          this.billingToast.set(`Payment complete. Your balance is now ${credits} credits.`);
        } else if (status === "paid") {
          this.refreshUserCredits();
          this.billingToast.set("Payment complete. Refreshing your credit balance.");
        } else {
          this.billingToast.set("Checkout returned before payment completed. Your credits will update after Stripe confirms payment.");
        }
        this.billingLoading.set(false);
        setTimeout(() => this.refreshUserCredits(), 3000);
        setTimeout(() => this.billingToast.set(""), 7000);
      },
      error: (err: { error?: { message?: string } }) => {
        this.billingError.set(err.error?.message ?? "Payment completed, but Pixora could not refresh your credits yet.");
        this.billingLoading.set(false);
        setTimeout(() => this.refreshUserCredits(), 3000);
        setTimeout(() => this.refreshUserCredits(), 8000);
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
    if (!container) {
      setTimeout(() => this.tryRenderGoogleButton(), 100);
      return;
    }
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
