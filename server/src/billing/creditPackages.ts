import type { CreditPackage } from "../types.js";

export const creditPackages: CreditPackage[] = [
  {
    id: "starter",
    name: "Starter pack",
    description: "Enough for 2 website generations.",
    credits: 10,
    amountCents: 500,
    currency: "usd"
  },
  {
    id: "growth",
    name: "Growth pack",
    description: "Best for testing multiple website directions.",
    credits: 35,
    amountCents: 1500,
    currency: "usd"
  },
  {
    id: "pro",
    name: "Pro pack",
    description: "A larger balance for repeated client work.",
    credits: 80,
    amountCents: 2900,
    currency: "usd"
  }
];

export const findCreditPackage = (packageId: string) => creditPackages.find((pack) => pack.id === packageId);
