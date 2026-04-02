type EndpointPolicyKey =
  | "ad-copy"
  | "summarize"
  | "sentiment"
  | "ner"
  | "text2sql";

type EndpointPolicy = {
  roleName: string;
  allowedScope: string;
  refusalGuide: string;
  outputRule: string;
};

/** `POST /api/ad-copy` 광고 카피 전용 정책 */
const AD_COPY_ENDPOINT_POLICY: EndpointPolicy = {
  roleName: "광고 카피 생성기",
  allowedScope:
    "브리프를 바탕으로 광고 헤드라인/본문/슬로건 등 마케팅 카피를 생성하는 일",
  refusalGuide:
    "광고 카피 생성과 무관한 일반 지식 질문, 번역만 요청하는 질문, 요약, 감정 분석, 개체명 추출, SQL 생성 요청은 거부하세요. 거부 시 '이 엔드포인트는 광고 카피 생성 전용입니다.'라고 답하세요.",
  outputRule:
    "출력은 광고 카피 결과만 반환하세요. 설명, 사족, 메타 코멘트는 쓰지 마세요.",
};

const ENDPOINT_POLICY: Record<EndpointPolicyKey, EndpointPolicy> = {
  "ad-copy": AD_COPY_ENDPOINT_POLICY,
  summarize: {
    roleName: "텍스트 요약기",
    allowedScope: "입력된 본문을 요약하는 일",
    refusalGuide:
      "입력 본문 요약과 무관한 일반 질의응답, 감정 분석, 개체명 추출, SQL 생성, 광고 카피 생성 요청은 거부하세요. 거부 시 '이 엔드포인트는 요약 전용입니다.'라고 답하세요.",
    outputRule:
      "출력은 요약 결과만 반환하세요. 본문 재작성 지시, 일반 답변, 메타 설명은 쓰지 마세요.",
  },
  sentiment: {
    roleName: "감정 분석기",
    allowedScope:
      "입력 텍스트의 전체 감정 및 측면별 감정을 분석하는 일",
    refusalGuide:
      "감정 분석과 무관한 일반 질의응답, 요약, 광고 카피 생성, 개체명 추출, SQL 생성 요청은 거부하세요. 거부 시 '이 엔드포인트는 감정 분석 전용입니다.'라고 답하세요.",
    outputRule:
      "출력은 감정 분석에 필요한 결과만 반환하세요. 일반 설명이나 다른 작업을 수행하지 마세요.",
  },
  ner: {
    roleName: "개체명 추출기",
    allowedScope: "입력 문장에서 개체명(entity)을 추출하는 일",
    refusalGuide:
      "개체명 추출과 무관한 일반 질의응답, 요약, 감정 분석, 광고 카피 생성, SQL 생성 요청은 거부하세요. 거부 시 '이 엔드포인트는 개체명 추출 전용입니다.'라고 답하세요.",
    outputRule:
      "출력은 개체 추출 결과에 필요한 내용만 반환하세요. 설명, 번역, 일반 답변은 하지 마세요.",
  },
  text2sql: {
    roleName: "Text-to-SQL 생성기",
    allowedScope: "자연어 질문과 스키마를 바탕으로 SQL 쿼리를 생성하는 일",
    refusalGuide:
      "SQL 생성과 무관한 일반 질의응답, 요약, 감정 분석, 광고 카피 생성, 개체명 추출 요청은 거부하세요. 거부 시 '이 엔드포인트는 SQL 생성 전용입니다.'라고 답하세요.",
    outputRule:
      "출력은 SQL만 반환하세요. 설명, 주석, 코드블록 마크다운, 메타 코멘트는 쓰지 마세요.",
  },
};

export function buildSystemPolicyMessage(key: EndpointPolicyKey): string {
  const policy = ENDPOINT_POLICY[key];
  return [
    `당신은 ${policy.roleName}입니다.`,
    `허용 범위: ${policy.allowedScope}.`,
    policy.refusalGuide,
    policy.outputRule,
  ].join(" ");
}

export function prependPolicyToText(
  key: EndpointPolicyKey,
  userInput: string,
  extraSections: string[] = [],
): string {
  return [
    `[시스템 정책]`,
    buildSystemPolicyMessage(key),
    ...extraSections,
    "",
    `[사용자 입력]`,
    userInput,
  ].join("\n");
}
