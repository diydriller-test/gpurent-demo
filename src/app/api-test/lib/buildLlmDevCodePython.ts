const MODEL = "Qwen/Qwen3.6-35B-A3B";

function escapeForPythonJsonString(s: string) {
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
  const systemContent = escapeForPythonJsonString(systemPrompt.trim());
  const content = escapeForPythonJsonString(userMessage.trim());
  const safeTemperature = Number.isFinite(temperature) ? temperature : 0.1;

  const systemLine = systemContent
    ? `        {"role": "system", "content": "${systemContent}"},\n`
    : "";

  return `from openai import OpenAI

client = OpenAI(
    base_url="${baseUrl}",
    api_key="YOUR_API_KEY",  # 발급받은 API 키를 입력하세요
)

response = client.chat.completions.create(
    model="${MODEL}",
    temperature=${safeTemperature},
    messages=[
${systemLine}        {"role": "user", "content": "${content}"},
    ],
)

print(response.choices[0].message.content)
`;
}
