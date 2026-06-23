import type { Api, Plan } from "@/lib/api";

/** UI 표기: 서버 `max_rps` 값을 분당 요청 수치로 그대로 표시 */
export function rpsToRequestsPerMinute(rps: number): number {
  if (!Number.isFinite(rps) || rps <= 0) return 0;
  return rps;
}

export function formatPlanRequestsPerMinute(rps: number): string {
  const count = rpsToRequestsPerMinute(rps);
  return `1분에 ${count.toLocaleString("ko-KR")}번 요청`;
}

/**
 * 백엔드 `/apis`를 불러오지 못할 때 UI 확인용 폴백 (이름은 inferPlanTask와 맞춤)
 */
export const DEMO_APIS_FALLBACK: Api[] = [
  {
    id: 91001,
    name: "Qwen 3.6 Text LLM",
    company_id: 1,
    company_name: "코그로보",
  },
  {
    id: 91002,
    name: "Qwen Embedding API",
    company_id: 1,
    company_name: "코그로보",
  },
  {
    id: 91003,
    name: "Qwen3 Reranker API",
    company_id: 1,
    company_name: "코그로보",
  },
  {
    id: 91004,
    name: "Qwen3 TTS API",
    company_id: 1,
    company_name: "코그로보",
  },
  {
    id: 91005,
    name: "Qwen3 STT API",
    company_id: 1,
    company_name: "코그로보",
  },
  {
    id: 91011,
    name: "Voice Clone API",
    company_id: 1,
    company_name: "코그로보",
  },
  {
    id: 91012,
    name: "Vision OCR",
    company_id: 1,
    company_name: "코그로보",
  },
  {
    id: 91013,
    name: "Text-to-Music API",
    company_id: 1,
    company_name: "코그로보",
    task_key: "Text-to-Music",
  },
  {
    id: 91014,
    name: "Image Generation API",
    company_id: 1,
    company_name: "코그로보",
    task_key: "Image Generation",
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
    features: ["전용 RPM·용량 협의", "전담 담당자", "맞춤 SLA·보안 검토"],
    is_active: true,
    sort_order: 3,
  },
];

function makePlans(
  idBase: number,
  starter: { price: number; rps: number },
  pro: { price: number; rps: number },
  enterprise: { rps: number },
): Plan[] {
  return [
    {
      id: idBase,
      name: "Starter",
      price_monthly: String(starter.price),
      description: "소규모 트래픽·프로토타입에 적합한 입문 등급",
      max_rps: starter.rps,
      period: "/월",
      features: ["예상 월 트래픽 기준 입문 등급", "기본 대시보드", "이메일 지원 (영업일)"],
      is_active: true,
      sort_order: 1,
    },
    {
      id: idBase + 1,
      name: "Pro",
      price_monthly: String(pro.price),
      description: "프로덕션 트래픽을 다루는 팀을 위한 표준 등급",
      max_rps: pro.rps,
      period: "/월",
      features: ["예상 월 트래픽 기준 표준 등급", "우선 지원 큐", "알림·웹훅 (베타)"],
      is_active: true,
      sort_order: 2,
    },
    {
      id: idBase + 2,
      name: "Enterprise",
      price_monthly: "0",
      description: "대규모·전용 용량·맞춤 계약",
      max_rps: enterprise.rps,
      period: "",
      features: ["전용 RPM·용량 협의", "전담 담당자", "맞춤 SLA·보안 검토"],
      is_active: true,
      sort_order: 3,
    },
  ];
}

export const HARDCODED_PLANS_BY_TASK: Partial<Record<PlanTask, Plan[]>> = {
  STT:              makePlans(88001, { price: 30000,  rps: 0.25 }, { price: 90000,  rps: 0.75 }, { rps: 0.75 }),
  TTS:              makePlans(88011, { price: 30000,  rps: 0.25 }, { price: 90000,  rps: 0.75 }, { rps: 0.75 }),
  Embedding:        makePlans(88021, { price: 20000,  rps: 0.5  }, { price: 60000,  rps: 1.5  }, { rps: 1.5  }),
  Reranker:         makePlans(88031, { price: 30000,  rps: 0.25 }, { price: 90000,  rps: 0.75 }, { rps: 0.75 }),
  "Voice Clone":    makePlans(88041, { price: 30000,  rps: 0.25 }, { price: 90000,  rps: 0.75 }, { rps: 0.75 }),
  Vision:           makePlans(88051, { price: 80000,  rps: 0.25 }, { price: 240000, rps: 0.75 }, { rps: 0.75 }),
  "Image Generation": makePlans(88061, { price: 100000, rps: 0.1 }, { price: 300000, rps: 0.3  }, { rps: 0.3  }),
  "Text-to-Music":  makePlans(88071, { price: 50000,  rps: 0.1  }, { price: 180000, rps: 0.3  }, { rps: 0.3  }),
  "Text Generation": makePlans(88081, { price: 150000, rps: 0.25 }, { price: 450000, rps: 0.75 }, { rps: 0.75 }),
};

/** api-test `selectedApi`와 동일한 문자열 (쿼리 `?chapter=` 값) */
export type PlansChapterParam =
  | "llm"
  | "embedding"
  | "reranker"
  | "tts"
  | "stt"
  | "voiceClone"
  | "image2text"
  | "t2m"
  | "t2i";

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
    case "voiceClone":
      return "Voice Clone";
    case "image2text":
      return "Vision";
    case "t2m":
      return "Text-to-Music";
    case "t2i":
      return "Image Generation";
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
  | "STT"
  | "Voice Clone"
  | "Vision"
  | "Text-to-Music"
  | "Image Generation";

export const PLAN_TASK_KEYS: PlanTask[] = [
  "STT",
  "TTS",
  "Text-to-Music",
  "Image Generation",
  "Embedding",
  "Reranker",
  "Voice Clone",
  "Vision",
  "Text Generation",
];

/** 플랜/마켓 API 카드와 `Api`의 task_key를 매칭 */
export function getApiTask(api: Api): PlanTask | null {
  const k = api.task_key;
  if (
    k === "Text Generation" ||
    k === "Embedding" ||
    k === "Reranker" ||
    k === "TTS" ||
    k === "STT" ||
    k === "Voice Clone" ||
    k === "Vision" ||
    k === "Text-to-Music" ||
    k === "Image Generation"
  ) {
    return k;
  }
  return inferPlanTask(api.name);
}

/** 카드 상단: 백엔드 `card_sublabel` 대신 TASK_META 고정 문구 사용 (베이스 모델명 비노출) */
export const MODU_NLP_SURFACE_TASKS: readonly PlanTask[] = [
  "Text Generation",
];

const TASK_META: Record<
  PlanTask,
  { displayName: string; sublabel: string; modelDisplay: string; tags: string[] }
> = {
  "Text Generation": {
    displayName: "대규모 언어 모델(LLM)",
    sublabel: "Gemma 4 • Text Generation",
    modelDisplay: "google/gemma-4-26b-a4b-it",
    tags: ["LLM", "Text-Gen", "GPT"],
  },
  Embedding: {
    displayName: "텍스트 임베딩(Embedding)",
    sublabel: "Qwen-Embedding • Embedding",
    modelDisplay: "Qwen3-Embedding-8B",
    tags: ["Embedding", "Semantic-Search"],
  },
  Reranker: {
    displayName: "문장 재순위(Reranking)",
    sublabel: "Qwen3 Reranker • Reranker",
    modelDisplay: "Qwen3-Reranker-8B",
    tags: ["Reranker", "Search-Quality"],
  },
  TTS: {
    displayName: "텍스트를 음성으로 변환(TTS)",
    sublabel: "Qwen3 Generation • TTS",
    modelDisplay: "Qwen3-TTS-12Hz-1.7B-CustomVoice",
    tags: ["TTS", "Audio"],
  },
  STT: {
    displayName: "음성을 텍스트로 변환(STT)",
    sublabel: "Qwen3 Audio • STT",
    modelDisplay: "faster-whisper-large-v3",
    tags: ["STT", "Transcription"],
  },
  "Voice Clone": {
    displayName: "목소리 복제(Voice Clone)",
    sublabel: "Voice Clone • TTS",
    modelDisplay: "Qwen3-TTS-12Hz-1.7B-Base",
    tags: ["VoiceClone", "Audio", "TTS"],
  },
  Vision: {
    displayName: "이미지를 문장으로 변환(Image-to-Text)",
    sublabel: "이미지 분석 • OCR",
    modelDisplay: "google/gemma-4-26b-a4b-it",
    tags: ["Vision", "OCR", "I2T"],
  },
  "Text-to-Music": {
    displayName: "문장을 음악으로 변환(Text-to-Music)",
    sublabel: "텍스트로 음악 생성 • T2M",
    modelDisplay: "acestep-v15-xl-sft",
    tags: ["T2M", "Music", "Audio"],
  },
  "Image Generation": {
    displayName: "이미지 생성(Image Generation)",
    sublabel: "텍스트로 이미지 생성 • T2I",
    modelDisplay: "Qwen-Image-Edit-2511-Lightning",
    tags: ["Image", "T2I"],
  },
};

/** 체험 페이지와 동일한 카드 헤더 표시명 */
export function getPlanTaskDisplayName(task: PlanTask): string {
  return TASK_META[task].displayName;
}

/** 플랜·API 체험 카드 상단 문구 — API 문서·TASK_META와 동일 체계 */
export function getPlanTaskSublabel(task: PlanTask): string {
  return TASK_META[task].sublabel;
}

/** 플랜·API 체험 카드의 모델 식별자 — 리스트 카드와 동일한 mono 표기에 사용 */
export function getPlanTaskModelDisplay(task: PlanTask): string {
  return TASK_META[task].modelDisplay;
}

/**
 * 백엔드 Api.name 기준으로 태스크 추정 (키워드 순서 중요)
 */
export function inferPlanTask(name: string): PlanTask | null {
  const n = name.toLowerCase();
  if (/\brerank|reranker\b/i.test(name)) return "Reranker";
  if (/embed|embedding/i.test(n)) return "Embedding";
  if (/\bstt\b|speech-to-text|transcri/i.test(n)) return "STT";
  if (/\btts\b|text-to-speech/i.test(n)) return "TTS";
  if (/voice[-\s]?clone|보이스[-\s]?클론/i.test(n)) return "Voice Clone";
  if (
    /image2text|image[-\s]?to[-\s]?text|img2text|vision[-\s]?ocr|ocr|이미지.*텍스트|이미지.*분석/i.test(
      n,
    )
  )
    return "Vision";
  if (/text[-\s]?to[-\s]?music|t2m|music[-\s]?gen|musicgen|음악.*생성|텍스트.*음악/i.test(n))
    return "Text-to-Music";
  if (/text[-\s]?to[-\s]?image|t2i|image[-\s]?gen|imagegen|이미지.*생성|텍스트.*이미지/i.test(n))
    return "Image Generation";
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
