const MODEL = "google/gemma-4-26b-a4b-it";

function escapeForPythonDoubleQuoted(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

export function buildLlmDevCodePython({
  systemPrompt,
  userMessage,
  temperature,
  baseUrl,
}: {
  systemPrompt: string;
  userMessage: string;
  temperature: number;
  baseUrl: string;
}) {
  const systemContent = escapeForPythonDoubleQuoted(systemPrompt.trim());
  const content = escapeForPythonDoubleQuoted(
    userMessage.trim() || "안녕하세요!"
  );
  const safeTemperature = Number.isFinite(temperature) ? temperature : 0.1;

  const systemLine = systemContent
    ? `    SystemMessage(content="${systemContent}"),  # 모델 역할·행동 지시 (선택)\n`
    : "";

  return `# pip install langchain-openai

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

# 1. API 설정
llm = ChatOpenAI(
    model="${MODEL}",              # 사용할 모델
    temperature=${safeTemperature},            # 생성 다양성 (0.0~1.0, 낮을수록 일관된 결과)
    api_key="YOUR_API_KEY",        # 발급받은 API 키를 입력하세요
    base_url="${baseUrl}/v1",  # API 엔드포인트
)

# 2. 메시지 구성
messages = [
${systemLine}    HumanMessage(content="${content}"),  # 사용자 질문/지시문
]

# 3. API 호출
response = llm.invoke(messages)

# 4. 결과 출력
print(response.content)
`;
}
