import { escapeForPythonJsonString } from "./escapeForPythonJsonString";

export function buildTtsDevCodePython({
  text,
  language,
  speaker,
  instruct,
  url,
}: {
  text: string;
  language?: string;
  speaker?: string;
  instruct?: string;
  url: string;
}) {
  const content = escapeForPythonJsonString(text.trim() || "안녕하세요.");
  const voice = (speaker ?? "ryan").toLowerCase();
  const lang = language && language !== "auto" ? language : "auto";
  const instructLine = instruct?.trim()
    ? `    "instruct": "${escapeForPythonJsonString(instruct.trim())}",  # 스타일 지시\n`
    : `    # "instruct": "밝고 활기차게 말해줘",  # 스타일 지시 (선택 사항)\n`;

  return `import requests

# 1. API 설정
url = "${url}"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",  # 발급받은 API 키를 입력하세요
}

# 2. 요청 데이터 설정
data = {
    "text": "${content}",      # 읽어줄 텍스트
    "language": "${lang}",     # 언어 설정 (auto, korean, english, japanese 등)
    "speaker": "${voice}",     # 화자 선택
${instructLine}}

# 3. API 호출
response = requests.post(url, headers=headers, json=data, timeout=60)
response.raise_for_status()

# 4. 결과 저장
with open("output.mp3", "wb") as f:
    f.write(response.content)
print("saved: output.mp3")
`;
}
