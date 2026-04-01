import { escapeForPythonJsonString } from "./escapeForPythonJsonString";

/**
 * 데모 앱의 `/api/text2sql` 프록시 — 동일 호스트에서 Bearer 토큰으로 호출하는 예시입니다.
 */
export function buildTextToSqlDevCodePython({
  text,
  ddl,
  temperature,
}: {
  text: string;
  ddl: string;
  temperature: number;
}) {
  const t = escapeForPythonJsonString(
    text.trim() || "자연어 질문을 입력하세요.",
  );
  const ddlText = escapeForPythonJsonString(ddl.trim());
  const temp = Number.isFinite(temperature) ? temperature : 0.2;

  return `import requests

url = "http://localhost:3000/api/text2sql"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
}

data = {
    "text": "${t}",
    ${ddl.trim() ? `"ddl": "${ddlText}",` : ""}
    "temperature": ${temp},
}

response = requests.post(url, headers=headers, json=data)
response.raise_for_status()
result = response.json()
print(result)
`;
}
