import type { BusinessIntake } from "../types.js";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const createDeploymentPlan = (intake: BusinessIntake) => {
  const repositoryName = `${slugify(intake.businessName)}-website`;

  return {
    repositoryName,
    suggestedHost: "vercel" as const,
    steps: [
      `Create a GitHub repository named ${repositoryName}.`,
      "Commit the generated static files from the renderer.",
      "Import the repository into Vercel as a static site.",
      "Set the production branch to main and deploy.",
      "Attach a custom domain when the client is ready."
    ]
  };
};
