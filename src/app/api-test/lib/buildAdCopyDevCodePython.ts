import { escapeForPythonJsonString } from "./escapeForPythonJsonString";

/**
 * Ad Copy Playground / Developer Console과 동일한 `POST /api/ad-copy` 호출 예시.
 * - 필수: `brief`
 * - 선택: `tone`, `channel` (빈 문자열 가능)
 * - `temperature`, `language` (언어 코드: ko, en, ja, zh …)
 * - 성공 시 `{ "headline": "...", "body": "..." }` (레거시 `copy` 문자열도 지원 가능)
 * - 오류 시 `{ "error": "..." }`
 */
export function buildAdCopyDevCodePython({
  brief,
  tone,
  channel,
  temperature,
  language,
}: {
  brief: string;
  tone: string;
  channel: string;
  temperature: number;
  language: string;
}) {
  const b = escapeForPythonJsonString(brief.trim() || "제품 브리프를 입력하세요.");
  const t = escapeForPythonJsonString(tone.trim());
  const c = escapeForPythonJsonString(channel.trim());
  const temp = Number.isFinite(temperature) ? temperature : 0.7;
  const lang = escapeForPythonJsonString((language.trim() || "ko").trim());

  return `"""Ad Copy Playground API — POST /api/ad-copy

플레이그라운드·Developer Console의 요청 전송과 동일한 JSON 본문입니다.
pip install requests
"""

import requests

# 데모 앱 origin (로컬 / 배포 도메인으로 변경)
BASE_URL = "http://localhost:3000"

url = f"{BASE_URL}/api/ad-copy"
headers = {
    "Content-Type": "application/json",
}
# 발급받은 API 키가 있을 때만 추가
# headers["Authorization"] = "Bearer YOUR_API_KEY"

data = {
    "brief": "${b}",
    "tone": "${t}",
    "channel": "${c}",
    "temperature": ${temp},
    "language": "${lang}",
}

response = requests.post(url, headers=headers, json=data, timeout=120)
payload = response.json()

if response.status_code == 200:
    h = payload.get("headline") or ""
    b = payload.get("body") or ""
    legacy = payload.get("copy") or ""
    if legacy:
        print(legacy)
    elif h or b:
        print(f"{h}\\n{b}".strip())
else:
    # 400, 429(한도 초과) 등 — 서버가 준 { "error": "..." } 확인
    print(payload)
`;
}
