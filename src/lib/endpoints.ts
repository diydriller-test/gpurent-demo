import type { PlanTask } from "@/app/plans/planCatalog";

export const REAL_ENDPOINTS = {
  llm: "http://aiapi.kogrobo.com:11115/llm",
  embedding: "http://aiapi.kogrobo.com:11115/embedding",
  reranker: "http://aiapi.kogrobo.com:11115/reranker",
  tts: "http://aiapi.kogrobo.com:11115/tts",
  stt: "http://aiapi.kogrobo.com:11115/stt",
  voiceClone: "http://aiapi.kogrobo.com:11115/voice-clone",
  image2text: "http://aiapi.kogrobo.com:11115/ocr",
  t2m: "http://aiapi.kogrobo.com:11115/music",
  t2i: "http://aiapi.kogrobo.com:11115/image",
} as const;

export const DUMMY_ENDPOINTS = {
  llm: "https://api.example.com",
  embedding: "https://api.example.com",
  reranker: "https://api.example.com",
  tts: "https://api.example.com",
  stt: "https://api.example.com",
  voiceClone: "https://api.example.com",
  image2text: "https://api.example.com",
  t2m: "https://api.example.com",
  t2i: "https://api.example.com",
} as const;

export type EndpointKey = keyof typeof REAL_ENDPOINTS;

const TASK_TO_ENDPOINT_KEY: Record<PlanTask, EndpointKey> = {
  "Text Generation": "llm",
  Embedding: "embedding",
  Reranker: "reranker",
  TTS: "tts",
  STT: "stt",
  "Voice Clone": "voiceClone",
  Vision: "image2text",
  "Text-to-Music": "t2m",
  "Image Generation": "t2i",
};

export function getRealEndpointByTask(task: PlanTask): string {
  return REAL_ENDPOINTS[TASK_TO_ENDPOINT_KEY[task]];
}
