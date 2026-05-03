import { randomUUID } from "node:crypto";
import { createDeploymentPlan } from "../deployment/plan.js";
import { retrieveContext } from "../rag/vectorStore.js";
import { renderWebsite, selectTemplate } from "../templates/templates.js";
import type { BusinessIntake, GeneratedSite, RetrievedContext } from "../types.js";
import { generateWebsiteContent } from "./geminiService.js";

interface GenerationState {
  intake: BusinessIntake;
  context?: RetrievedContext[];
  templateId?: string;
}

const retrieveNode = (state: GenerationState): GenerationState => ({
  ...state,
  context: retrieveContext(state.intake)
});

const templateNode = (state: GenerationState): GenerationState => ({
  ...state,
  templateId: selectTemplate(state.intake.businessType).id
});

export const runGenerationGraph = async (intake: BusinessIntake): Promise<GeneratedSite> => {
  const withContext = retrieveNode({ intake });
  const withTemplate = templateNode(withContext);
  const content = await generateWebsiteContent(intake, withTemplate.context ?? []);
  const rendered = renderWebsite(intake, content, withTemplate.templateId ?? "local-service");

  return {
    id: randomUUID(),
    templateId: withTemplate.templateId ?? "local-service",
    ...rendered,
    content,
    retrievedContext: withTemplate.context ?? [],
    deploymentPlan: createDeploymentPlan(intake)
  };
};
