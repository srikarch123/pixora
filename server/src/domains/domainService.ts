import { createHash } from "node:crypto";

export interface DomainSuggestion {
  domain: string;
  available: boolean;
  premium: boolean;
  priceCents: number;
  renewalPriceCents: number;
  currency: "usd";
  registrar: "cloudflare";
  reason?: string;
}

type CloudflareDomainCheck = {
  name: string;
  registrable: boolean;
  reason?: string;
  tier?: "standard" | "premium";
  pricing?: {
    currency: string;
    registration_cost: string;
    renewal_cost: string;
  };
};

type CloudflareResponse<T> = {
  success: boolean;
  result?: T;
  errors?: Array<{ code?: number; message: string }>;
};

export class CloudflareRegistrarError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "CloudflareRegistrarError";
  }
}

const supportedTlds = ["com", "net", "org", "co", "io", "ai", "app", "dev", "site", "studio"];

const normalizeDomainQuery = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/\.$/, "");

const moneyToCents = (value: string | undefined) => Math.round(Number(value ?? 0) * 100);

const getCloudflareConfig = () => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) {
    throw new Error("Cloudflare Registrar is not configured. Add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.");
  }
  return { accountId, token };
};

const cloudflareRequest = async <T>(path: string, init: RequestInit): Promise<T> => {
  const { accountId, token } = getCloudflareConfig();
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });
  const payload = (await response.json()) as CloudflareResponse<T>;
  if (!response.ok || !payload.success || !payload.result) {
    const message = payload.errors?.map((error) => error.message).join("; ") || `Cloudflare request failed (${response.status}).`;
    const authFailed = response.status === 401 || response.status === 403 || payload.errors?.some((error) => error.code === 10000);
    throw new CloudflareRegistrarError(
      authFailed
        ? "Cloudflare rejected the Registrar API token. Create a token for this account with Registrar permissions."
        : message,
      authFailed ? 401 : response.status || 502
    );
  }
  return payload.result;
};

const candidateDomains = (query: string) => {
  const normalized = normalizeDomainQuery(query);
  const [name, explicitTld] = normalized.split(".");
  const label = (name || "my-website").replace(/[^a-z0-9-]/g, "").slice(0, 50) || "my-website";
  const tlds = explicitTld ? [explicitTld, ...supportedTlds.filter((tld) => tld !== explicitTld)] : supportedTlds;
  return [...new Set(tlds.slice(0, 8).map((tld) => `${label}.${tld}`))];
};

const toSuggestion = (domain: string, check?: CloudflareDomainCheck): DomainSuggestion => {
  const premium = check?.tier === "premium" || check?.reason === "domain_premium";
  return {
    domain: check?.name ?? domain,
    available: check?.registrable === true,
    premium,
    priceCents: moneyToCents(check?.pricing?.registration_cost),
    renewalPriceCents: moneyToCents(check?.pricing?.renewal_cost),
    currency: "usd",
    registrar: "cloudflare",
    reason: check?.reason
  };
};

export const searchDomains = async (query: string): Promise<DomainSuggestion[]> => {
  const domains = candidateDomains(query);
  const result = await cloudflareRequest<{ domains: CloudflareDomainCheck[] }>("/registrar/domain-check", {
    method: "POST",
    body: JSON.stringify({ domains })
  });
  const checks = new Map(result.domains.map((domain) => [domain.name, domain]));
  return domains.map((domain) => toSuggestion(domain, checks.get(domain)));
};

export const findDomainSuggestion = async (domain: string): Promise<DomainSuggestion> => {
  const normalized = normalizeDomainQuery(domain);
  const result = await cloudflareRequest<{ domains: CloudflareDomainCheck[] }>("/registrar/domain-check", {
    method: "POST",
    body: JSON.stringify({ domains: [normalized] })
  });
  return toSuggestion(normalized, result.domains[0]);
};

// ─── Cloudflare Pages ─────────────────────────────────────────────────────────

export const pagesProjectName = (generationId: string) =>
  `px-${generationId.replace(/-/g, "").slice(0, 20)}`;

const createPagesProject = async (projectName: string): Promise<void> => {
  try {
    await cloudflareRequest<{ name: string }>("/pages/projects", {
      method: "POST",
      body: JSON.stringify({ name: projectName, production_branch: "main" })
    });
  } catch (error) {
    if (error instanceof CloudflareRegistrarError) {
      const msg = error.message.toLowerCase();
      // Ignore "project already exists" — idempotent
      if (msg.includes("already") || msg.includes("exists") || msg.includes("taken")) return;
    }
    throw error;
  }
};

const deployHtmlToPages = async (projectName: string, html: string): Promise<void> => {
  const { accountId, token } = getCloudflareConfig();
  const hash = createHash("sha256").update(html).digest("hex");
  const form = new FormData();
  form.append("manifest", JSON.stringify({ "/index.html": hash }));
  form.append("/index.html", new Blob([html], { type: "text/html" }), "index.html");
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form }
  );
  const payload = (await response.json()) as CloudflareResponse<{ id: string }>;
  if (!response.ok || !payload.success) {
    const message = payload.errors?.map((e) => e.message).join("; ") || `Pages deploy failed (${response.status}).`;
    throw new CloudflareRegistrarError(message, response.status || 502);
  }
};

const attachDomainToPages = async (projectName: string, domain: string): Promise<void> => {
  try {
    await cloudflareRequest<{ name: string }>(`/pages/projects/${projectName}/domains`, {
      method: "POST",
      body: JSON.stringify({ name: domain })
    });
  } catch (error) {
    if (error instanceof CloudflareRegistrarError) {
      const msg = error.message.toLowerCase();
      // Ignore "domain already attached" — idempotent
      if (msg.includes("already") || msg.includes("exists")) return;
    }
    throw error;
  }
};

export const deployToCloudflarePages = async (
  generationId: string,
  html: string,
  customDomain?: string
): Promise<{ pagesUrl: string }> => {
  const projectName = pagesProjectName(generationId);
  await createPagesProject(projectName);
  await deployHtmlToPages(projectName, html);
  if (customDomain) {
    await attachDomainToPages(projectName, customDomain);
  }
  return { pagesUrl: `https://${projectName}.pages.dev` };
};
