import { escapeForPythonJsonString } from "./escapeForPythonJsonString";

/**
 * 데모 앱의 `/api/sentiment` 프록시 — 동일 호스트에서 Bearer 토큰으로 호출하는 예시입니다.
 */
export function buildSentimentDevCodePython({
  text,
  temperature,
}: {
  text: string;
  temperature: number;
}) {
  const t = escapeForPythonJsonString(
    text.trim() || "분석할 리뷰 텍스트를 입력하세요.",
  );
  const temp = Number.isFinite(temperature) ? temperature : 0.2;

  return `import requests

url = "http://localhost:3000/api/sentiment"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
}

data = {
    "text": "${t}",
    "temperature": ${temp},
}

response = requests.post(url, headers=headers, json=data)
response.raise_for_status()
result = response.json()
print(result)
`;
}
