import { escapeForPythonJsonString } from "./escapeForPythonJsonString";

const MODEL = "Qwen3-TTS";

export function buildTtsDevCodePython({
  text,
  language,
  speaker,
  url,
}: {
  text: string;
  language?: string;
  speaker?: string;
  url: string;
}) {
  const content = escapeForPythonJsonString(text.trim() || "안녕하세요.");
  const voice = (speaker ?? "ryan").toLowerCase();
  const langLine =
    language && language !== "auto"
      ? `    "language": "${language}",\n`
      : "";

  return `import requests

url = "${url}"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
}

data = {
    "model": "${MODEL}",
    "input": "${content}",
    "voice": "${voice}",
${langLine}    "response_format": "mp3",
}

response = requests.post(url, headers=headers, json=data)
response.raise_for_status()

with open("output.mp3", "wb") as f:
    f.write(response.content)
print("saved: output.mp3")
`;
}
