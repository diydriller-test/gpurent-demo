export type ApiId =
  | "llm"
  | "adCopy"
  | "summarize"
  | "sentiment"
  | "ner"
  | "textToSql"
  | "embedding"
  | "reranker"
  | "tts"
  | "stt";

/** POST /api/sentiment 응답과 동일 구조 */
export type SentimentAnalysisPayload = {
  overall: { label: string; score: number };
  aspects: Array<{ aspect: string; label: string; score: number }>;
};

/** POST /api/ner 응답과 동일 구조 */
export type NerPayload = {
  entities: Array<{ text: string; label: string; category: string }>;
};

/** POST /api/text2sql 응답과 동일 구조 */
export type TextToSqlPayload = {
  sql: string;
};

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
};

export type RerankResult = {
  rank: number;
  doc: string;
  score: number;
};

// STT 언어 코드는 page.tsx에서 별도 union 타입으로 관리 중이라,
// 여기서는 string 기반으로 최소 호환 타입을 제공합니다.
export type SttLanguage = string;

export type SttHelpTooltipId = "vad" | "beam";

