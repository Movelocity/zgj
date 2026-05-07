import { ChromaClient } from "chromadb";
import type { Collection, Metadata } from "chromadb";
import { env, pipeline } from "@xenova/transformers";
import { config } from "./config.js";

env.allowLocalModels = false;

type FeatureExtractionPipeline = Awaited<ReturnType<typeof pipeline>>;

export type OpportunityVectorInput = {
  id: number | string;
  company: string;
  title: string;
  category: string;
  location?: string;
  cadence?: string;
  summary?: string;
  responsibilities?: string[];
  requirements?: string[];
  contact_email?: string;
  note?: string;
  status?: string;
  sort_order?: number;
};

export type MatchRequest = {
  resume: unknown;
  top_k?: number;
};

export type OpportunityMatch = {
  id: string;
  opportunity_id: number;
  company: string;
  title: string;
  category: string;
  location: string;
  contact_email: string;
  status: string;
  distance: number | null;
  score: number;
  document: string;
  reason: string;
};

let extractorPromise: Promise<FeatureExtractionPipeline> | undefined;
let collectionPromise: Promise<Collection> | undefined;

function getExtractor() {
  if (!extractorPromise) {
    console.log(`[vectors] loading embedding model ${config.embeddingModel}`);
    extractorPromise = pipeline("feature-extraction", config.embeddingModel);
  }
  return extractorPromise;
}

function getClient() {
  return new ChromaClient({ path: config.chromaUrl });
}

async function getCollection() {
  if (!collectionPromise) {
    const client = getClient();
    collectionPromise = client.getOrCreateCollection({
      name: config.chromaCollection,
      metadata: {
        description: "Job opportunities for resume semantic matching",
        embedding_model: config.embeddingModel,
      },
    });
  }
  return collectionPromise;
}

function clean(value: unknown): string {
  return String(value || "").trim();
}

function cleanLines(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map(clean).filter(Boolean);
}

function normalizeOpportunity(item: OpportunityVectorInput): OpportunityVectorInput {
  return {
    ...item,
    company: clean(item.company),
    title: clean(item.title),
    category: clean(item.category),
    location: clean(item.location),
    cadence: clean(item.cadence),
    summary: clean(item.summary),
    responsibilities: cleanLines(item.responsibilities),
    requirements: cleanLines(item.requirements),
    contact_email: clean(item.contact_email),
    note: clean(item.note),
    status: clean(item.status) || "published",
  };
}

export function opportunityVectorId(id: number | string) {
  return `job_opportunity:${id}`;
}

export function opportunityToDocument(opportunity: OpportunityVectorInput) {
  const item = normalizeOpportunity(opportunity);
  const sections = [
    `企业：${item.company}`,
    `岗位：${item.title}`,
    `类别：${item.category}`,
    item.location ? `地点：${item.location}` : "",
    item.cadence ? `到岗/周期：${item.cadence}` : "",
    item.summary ? `简介：${item.summary}` : "",
    item.responsibilities?.length ? `岗位职责：\n${item.responsibilities.map((line) => `- ${line}`).join("\n")}` : "",
    item.requirements?.length ? `任职要求：\n${item.requirements.map((line) => `- ${line}`).join("\n")}` : "",
    item.note ? `备注：${item.note}` : "",
  ];

  return sections.filter(Boolean).join("\n");
}

function opportunityToMetadata(opportunity: OpportunityVectorInput): Metadata {
  const item = normalizeOpportunity(opportunity);
  return {
    opportunity_id: Number(item.id),
    company: item.company,
    title: item.title,
    category: item.category,
    location: item.location || "",
    contact_email: item.contact_email || "",
    status: item.status || "published",
    sort_order: Number(item.sort_order || 0),
  };
}

function vectorToArray(output: unknown): number[] {
  const data = output as { data?: Float32Array | number[]; dims?: number[] };
  if (data.data && typeof data.data.length === "number") {
    return Array.from(data.data).map((value) => Number(value));
  }
  if (Array.isArray(output)) {
    return output.flat(3).map((value) => Number(value));
  }
  throw new Error("embedding output format is not supported");
}

async function embed(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  const output = await (extractor as unknown as (input: string, options: Record<string, unknown>) => Promise<unknown>)(text, {
    pooling: "mean",
    normalize: true,
  });
  return vectorToArray(output);
}

function passageText(text: string) {
  return `passage: ${text}`;
}

function queryText(text: string) {
  return `query: ${text}`;
}

function stringifyResume(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (value && typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return "";
}

function scoreFromDistance(distance: number | null | undefined): number {
  if (distance === null || distance === undefined || Number.isNaN(distance)) {
    return 0;
  }
  return Number((1 / (1 + Math.max(0, distance))).toFixed(4));
}

function buildReason(metadata: Metadata | null | undefined, score: number) {
  if (!metadata) {
    return `语义匹配度 ${Math.round(score * 100)}%。`;
  }
  const title = clean(metadata.title);
  const category = clean(metadata.category);
  const company = clean(metadata.company);
  return `简历内容与 ${company ? `${company} ` : ""}${title || "该岗位"}${category ? `（${category}）` : ""} 的语义要求接近，匹配度约 ${Math.round(score * 100)}%。`;
}

export async function upsertOpportunityVectors(input: OpportunityVectorInput | OpportunityVectorInput[]) {
  const items = (Array.isArray(input) ? input : [input]).map(normalizeOpportunity);
  const published = items.filter((item) => item.status === "published");
  const unpublishedIds = items.filter((item) => item.status !== "published").map((item) => item.id);

  if (unpublishedIds.length > 0) {
    await deleteOpportunityVectors(unpublishedIds);
  }

  if (published.length === 0) {
    return { upserted: 0, deleted: unpublishedIds.length };
  }

  const documents = published.map(opportunityToDocument);
  const embeddings = await Promise.all(documents.map((document) => embed(passageText(document))));
  const collection = await getCollection();

  await collection.upsert({
    ids: published.map((item) => opportunityVectorId(item.id)),
    documents,
    embeddings,
    metadatas: published.map(opportunityToMetadata),
  });

  return { upserted: published.length, deleted: unpublishedIds.length };
}

export async function deleteOpportunityVectors(ids: Array<number | string>) {
  const vectorIds = ids.map(opportunityVectorId);
  if (vectorIds.length === 0) {
    return { deleted: 0 };
  }

  const collection = await getCollection();
  const result = await collection.delete({ ids: vectorIds });
  return { deleted: result.deleted ?? 0 };
}

export async function matchResumeToOpportunities(request: MatchRequest) {
  const resumeText = stringifyResume(request.resume);
  if (!resumeText) {
    throw new Error("简历内容不能为空");
  }

  const topK = Math.max(1, Math.min(Number(request.top_k || 5), 20));
  const queryEmbedding = await embed(queryText(resumeText));
  const collection = await getCollection();
  const count = await collection.count();

  if (count === 0) {
    return {
      total: 0,
      matches: [] as OpportunityMatch[],
      embedding_model: config.embeddingModel,
      collection: config.chromaCollection,
    };
  }

  const results = await collection.query<Metadata>({
    queryEmbeddings: [queryEmbedding],
    nResults: Math.min(topK, count),
    include: ["metadatas", "documents", "distances"],
  });

  const rows = results.rows()[0] || [];
  const matches = rows.map((row) => {
    const metadata = row.metadata || {};
    const score = scoreFromDistance(row.distance);
    return {
      id: row.id,
      opportunity_id: Number(metadata.opportunity_id || 0),
      company: clean(metadata.company),
      title: clean(metadata.title),
      category: clean(metadata.category),
      location: clean(metadata.location),
      contact_email: clean(metadata.contact_email),
      status: clean(metadata.status),
      distance: row.distance ?? null,
      score,
      document: row.document || "",
      reason: buildReason(metadata, score),
    };
  });

  return {
    total: matches.length,
    matches,
    embedding_model: config.embeddingModel,
    collection: config.chromaCollection,
  };
}

export async function opportunityVectorHealth() {
  const collection = await getCollection();
  const count = await collection.count();
  return {
    chroma_url: config.chromaUrl,
    collection: config.chromaCollection,
    embedding_model: config.embeddingModel,
    count,
  };
}
