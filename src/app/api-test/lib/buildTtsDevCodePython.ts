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
import random

# 1. API 설정 - 요청마다 고유한 랜덤 ID 생성
rand = random.randint(0, 999_999_999)
url = f"${url}/tts/_inference/tts/{rand}"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",  # 발급받은 API 키를 입력하세요
}

# 2. 요청 데이터 설정
data = {
    "text": "${content}",      # 읽어줄 텍스트
    "language": "${lang}",     # 언어 설정 (auto, korean, english, japanese 등)
    "speaker": "${voice}",     # 화자 선택
${instructLine}}

# 3. API 호출 (form-encoded 형식으로 전송)
response = requests.post(url, headers=headers, data=data, timeout=60)
response.raise_for_status()

# 4. 결과 저장 (wb: write binary)
with open("output.mp3", "wb") as f:
    f.write(response.content)
print("saved: output.mp3")
`;
}
