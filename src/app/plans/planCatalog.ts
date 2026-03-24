import type { Api, Plan } from "@/lib/api";

/**
 * 백엔드 `/apis`를 불러오지 못할 때 UI 확인용 폴백 (이름은 inferPlanTask와 맞춤)
 */
export const DEMO_APIS_FALLBACK: Api[] = [
  {
    id: 91001,
    name: "GPT-OSS Text LLM",
    company_id: 1,
    company_name: "GPU Modu",
  },
  {
    id: 91002,
    name: "Qwen Embedding API",
    company_id: 1,
    company_name: "GPU Modu",
  },
  {
    id: 91003,
    name: "Qwen3 Reranker API",
    company_id: 1,
    company_name: "GPU Modu",
  },
  {
    id: 91004,
    name: "Qwen3 TTS API",
    company_id: 1,
    company_name: "GPU Modu",
  },
  {
    id: 91005,
    name: "Qwen3 STT API",
    company_id: 1,
    company_name: "GPU Modu",
  },
];

/**
 * 데모 모드에서 플랜 상세 UI용 (가격·한도는 예시이며 확정 전)
 * sort_order 2 = 중간 등급을 "인기"로 표시
 */
export const DEMO_PLANS_THREE_TIERS: Plan[] = [
  {
    id: 99001,
    name: "Starter",
    price_monthly: "49000",
    description: "소규모 트래픽·프로토타입에 적합한 입문 등급",
    max_rps: 5,
    period: "/월",
    features: [
      "예상 월 트래픽 ~50만 요청 수준",
      "기본 대시보드",
      "이메일 지원 (영업일)",
    ],
    is_active: true,
    sort_order: 1,
  },
  {
    id: 99002,
    name: "Pro",
    price_monthly: "199000",
    description: "프로덕션 트래픽을 다루는 팀을 위한 표준 등급",
    max_rps: 25,
    period: "/월",
    features: [
      "예상 월 트래픽 ~300만 요청 수준",
      "우선 지원 큐",
      "알림·웹훅 (베타)",
    ],
    is_active: true,
    sort_order: 2,
  },
  {
    id: 99003,
    name: "Enterprise",
    price_monthly: "0",
    description: "대규모·전용 용량·맞춤 계약",
    max_rps: 100,
    period: "",
    features: [
      "전용 RPS·용량 협의",
      "전담 담당자",
      "맞춤 SLA·보안 검토",
    ],
    is_active: true,
    sort_order: 3,
  },
];

/** api-test `selectedApi`와 동일한 문자열 (쿼리 `?chapter=` 값) */
export type PlansChapterParam =
  | "llm"
  | "embedding"
  | "reranker"
  | "tts"
  | "stt";

export function chapterQueryToPlanTask(
  chapter: string | null,
): PlanTask | null {
  switch (chapter) {
    case "llm":
      return "Text Generation";
    case "embedding":
      return "Embedding";
    case "reranker":
      return "Reranker";
    case "tts":
      return "TTS";
    case "stt":
      return "STT";
    default:
      return null;
  }
}

/** api-test 마켓플레이스 Tasks와 동일 */
export type PlanTask =
  | "Text Generation"
  | "Embedding"
  | "Reranker"
  | "TTS"
  | "STT";

export const PLAN_TASK_KEYS: PlanTask[] = [
  "Text Generation",
  "Embedding",
  "Reranker",
  "TTS",
  "STT",
];

const TASK_META: Record<
  PlanTask,
  { sublabel: string; modelDisplay: string; tags: string[] }
> = {
  "Text Generation": {
    sublabel: "GPT-OSS • Text Generation",
    modelDisplay: "gpt-oss-120B",
    tags: ["#LLM", "#Text-Gen"],
  },
  Embedding: {
    sublabel: "Qwen-Embedding • Embedding",
    modelDisplay: "Qwen-Embedding-8B",
    tags: ["#Embedding", "#Semantic-Search"],
  },
  Reranker: {
    sublabel: "Qwen3 Reranker • Reranker",
    modelDisplay: "Qwen3 Reranker-8B",
    tags: ["#Reranker", "#Qwen3", "#Search-Quality"],
  },
  TTS: {
    sublabel: "Qwen3 Generation • TTS",
    modelDisplay: "Qwen3-TTS",
    tags: ["#TTS", "#Audio"],
  },
  STT: {
    sublabel: "Qwen3 Audio • STT",
    modelDisplay: "Qwen3-STT",
    tags: ["#STT", "#Transcription"],
  },
};

/**
 * 백엔드 Api.name 기준으로 태스크 추정 (키워드 순서 중요)
 */
export function inferPlanTask(name: string): PlanTask | null {
  const n = name.toLowerCase();
  if (/\brerank|reranker\b/i.test(name)) return "Reranker";
  if (/embed|embedding/i.test(n)) return "Embedding";
  if (/\bstt\b|speech-to-text|transcri/i.test(n)) return "STT";
  if (/\btts\b|text-to-speech/i.test(n)) return "TTS";
  if (
    /\bllm\b|\bgpt\b|chat|text.?gen|oss|completion|openai|language.?model/i.test(
      n,
    )
  ) {
    return "Text Generation";
  }
  return null;
}

export type PlanCardDisplay = {
  task: PlanTask | null;
  sublabel: string;
  modelDisplay: string;
  tags: string[];
};

export function getPlanCardDisplay(api: Api): PlanCardDisplay {
  const task = inferPlanTask(api.name);
  if (!task) {
    return {
      task: null,
      sublabel: api.company_name || "API",
      modelDisplay: api.name,
      tags: ["#API"],
    };
  }
  const meta = TASK_META[task];
  return {
    task,
    sublabel: meta.sublabel,
    modelDisplay: meta.modelDisplay,
    tags: meta.tags,
  };
}
