import { escapeForPythonJsonString } from "./escapeForPythonJsonString";

/**
 * 데모 앱의 `/api/summarize` 프록시 — 동일 호스트에서 Bearer 토큰으로 호출하는 예시입니다.
 */
export function buildSummarizeDevCodePython({
  text,
  style,
  temperature,
}: {
  text: string;
  style: string;
  temperature: number;
}) {
  const t = escapeForPythonJsonString(
    text.trim() || "요약할 본문을 입력하세요.",
  );
  const s = escapeForPythonJsonString(style.trim());
  const temp = Number.isFinite(temperature) ? temperature : 0.3;

  return `import requests

url = "http://localhost:3000/api/summarize"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
}

data = {
    "text": "${t}",
    "style": "${s}",
    "temperature": ${temp},
}

response = requests.post(url, headers=headers, json=data)
response.raise_for_status()
result = response.json()
print(result.get("summary", result))
`;
}
