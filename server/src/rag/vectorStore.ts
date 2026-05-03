import { knowledgeDocuments } from "./knowledgeBase.js";
import type { BusinessIntake, RetrievedContext } from "../types.js";

type Vector = Map<string, number>;

const tokenize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

const embed = (text: string): Vector => {
  const vector = new Map<string, number>();
  for (const token of tokenize(text)) {
    vector.set(token, (vector.get(token) ?? 0) + 1);
  }
  return vector;
};

const cosineSimilarity = (a: Vector, b: Vector) => {
  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (const value of a.values()) {
    magnitudeA += value * value;
  }

  for (const [key, value] of b.entries()) {
    magnitudeB += value * value;
    dot += (a.get(key) ?? 0) * value;
  }

  if (!magnitudeA || !magnitudeB) {
    return 0;
  }

  return dot / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
};

const indexedDocuments = knowledgeDocuments.map((document) => ({
  ...document,
  vector: embed(`${document.title} ${document.content}`)
}));

export const retrieveContext = (intake: BusinessIntake, limit = 4): RetrievedContext[] => {
  const query = [
    intake.businessType,
    intake.city,
    intake.country,
    intake.description,
    intake.audience,
    intake.sections.join(" "),
    intake.offerings.join(" ")
  ].join(" ");

  const queryVector = embed(query);

  return indexedDocuments
    .map((document) => ({
      id: document.id,
      title: document.title,
      content: document.content,
      score: Number(cosineSimilarity(queryVector, document.vector).toFixed(4))
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};
