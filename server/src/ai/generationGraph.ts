import { randomUUID } from "node:crypto";
import { createDeploymentPlan } from "../deployment/plan.js";
import { retrieveContext } from "../rag/vectorStore.js";
import { renderWebsite, selectTemplate } from "../templates/templates.js";
import type { BusinessIntake, GeneratedSite, RetrievedContext } from "../types.js";
import { generateWebsiteContent } from "./contentService.js";

interface GenerationState {
  intake: BusinessIntake;
  context?: RetrievedContext[];
  templateId?: string;
}

const retrieveNode = (state: GenerationState): GenerationState => ({
  ...state,
  context: retrieveContext(state.intake)
});

const templateNode = (state: GenerationState, usedTemplateIds: string[] = []): GenerationState => ({
  ...state,
  templateId: selectTemplate(state.intake.businessType, usedTemplateIds).id
});

export const runGenerationGraph = async (intake: BusinessIntake, usedTemplateIds: string[] = []): Promise<GeneratedSite> => {
  const withContext = retrieveNode({ intake });
  const withTemplate = templateNode(withContext, usedTemplateIds);
  const { content, source } = await generateWebsiteContent(intake, withTemplate.context ?? []);
  const rendered = renderWebsite(intake, content, withTemplate.templateId ?? "local-service");

  return {
    id: randomUUID(),
    templateId: withTemplate.templateId ?? "local-service",
    ...rendered,
    content,
    generationSource: source,
    retrievedContext: withTemplate.context ?? [],
    deploymentPlan: createDeploymentPlan(intake)
  };
};
