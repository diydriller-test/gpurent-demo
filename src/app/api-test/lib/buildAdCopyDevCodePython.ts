import { escapeForPythonJsonString } from "./escapeForPythonJsonString";

/**
 * 데모 앱의 `/api/ad-copy` 프록시 — 동일 호스트에서 Bearer 토큰으로 호출하는 예시입니다.
 */
export function buildAdCopyDevCodePython({
  brief,
  tone,
  channel,
  temperature,
}: {
  brief: string;
  tone: string;
  channel: string;
  temperature: number;
}) {
  const b = escapeForPythonJsonString(brief.trim() || "제품 브리프를 입력하세요.");
  const t = escapeForPythonJsonString(tone.trim());
  const c = escapeForPythonJsonString(channel.trim());
  const temp = Number.isFinite(temperature) ? temperature : 0.7;

  return `import requests

url = "http://localhost:3000/api/ad-copy"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
}

data = {
    "brief": "${b}",
    "tone": "${t}",
    "channel": "${c}",
    "temperature": ${temp},
}

response = requests.post(url, headers=headers, json=data)
response.raise_for_status()
result = response.json()
print(result.get("copy", result))
`;
}
