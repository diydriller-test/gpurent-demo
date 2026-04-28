import { escapeForPythonJsonString } from "./escapeForPythonJsonString";

/**
 * Playground는 클라이언트에서 파형을 시뮬레이션합니다.
 * 아래는 Text API와 동일 호스트(51089) 기준 OpenAI 호환 음성 합성 예시입니다.
 */
const URL = "http://aiapi.kogrobo.com/gateway/v1/audio/speech";
const MODEL = "Qwen3-TTS";

export function buildTtsDevCodePython({ text }: { text: string }) {
  const content = escapeForPythonJsonString(text.trim() || "안녕하세요.");

  return `import requests

url = "${URL}"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
}

data = {
    "model": "${MODEL}",
    "input": "${content}",
    "voice": "alloy",
    "response_format": "mp3",
}

response = requests.post(url, headers=headers, json=data)
response.raise_for_status()

with open("output.mp3", "wb") as f:
    f.write(response.content)
print("saved: output.mp3")
`;
}
