import { escapeForPythonJsonString } from "./escapeForPythonJsonString";

export function buildT2mDevCodePython({
  prompt,
  lyrics,
  instrumental,
  duration,
  seed,
  url,
  apiKey = "YOUR_API_KEY",
}: {
  prompt: string;
  lyrics: string;
  instrumental: boolean;
  duration: number;
  seed: string;
  url: string;
  apiKey?: string;
}) {
  const safePrompt = escapeForPythonJsonString(prompt.trim() || "Upbeat jazz with piano and saxophone, 120bpm, warm and lively");
  const safeLyrics = escapeForPythonJsonString(lyrics.trim());
  const lyricsLine = !instrumental && safeLyrics
    ? `    "lyrics": "${safeLyrics}",        # 가사 (선택)\n`
    : "";
  const seedValue = seed !== "" ? Number(seed) : -1;

  return `import random
import requests

# 1. API 설정 - 요청마다 고유한 랜덤 ID 생성
rand = random.randint(0, 999_999_999)
url = f"${url}/_inference/text2music/{rand}"
headers = {
    "Authorization": "Bearer ${apiKey}",  # 발급받은 API 키를 입력하세요
    "Content-Type": "application/json",
}

# 2. 요청 데이터 설정
import json
data = {
    "prompt": "${safePrompt}",  # 음악 스타일·분위기 설명
    "instrumental": ${instrumental ? "True" : "False"},  # True: 연주곡 / False: 보컬 포함
${lyricsLine}    "audio_duration": ${duration},  # 음악 길이 (초)
    "seed": ${seedValue},  # 랜덤 시드 (-1이면 매번 다른 결과)
}

# 3. API 호출
response = requests.post(url, headers=headers, data=json.dumps(data), timeout=300)
response.raise_for_status()

# 4. 결과 저장
with open("output.mp3", "wb") as f:
    f.write(response.content)
print("saved: output.mp3")
`;
}
