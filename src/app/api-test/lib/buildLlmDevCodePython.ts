const URL = "http://gpurent.kogrobo.com:51089/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

function escapeForPythonJsonString(s: string) {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
}

export function buildLlmDevCodePython({
  userMessage,
  temperature,
}: {
  userMessage: string;
  temperature: number;
}) {
  const content = escapeForPythonJsonString(userMessage.trim());
  const safeTemperature = Number.isFinite(temperature) ? temperature : 0.1;

  return `import requests

# 1. API 설정 (vLLM Workstation 전용 포트)
url = "${URL}"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",  # 발급받은 API 키를 입력하세요
    "Content-Type": "application/json"
}

# 2. 요청 데이터 구성
data = {
    "model": "${MODEL}",
    "messages": [
        {"role": "user", "content": "${content}"}
    ],
    "temperature": ${safeTemperature}
}

# 3. API 호출 및 결과 출력
response = requests.post(url, headers=headers, json=data)
result = response.json()

print(result["choices"][0]["message"]["content"])
`;
}

