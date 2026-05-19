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
    ? `    "instruct": "${escapeForPythonJsonString(instruct.trim())}",\n`
    : "";

  return `import requests

url = "${url}"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",  # 발급받은 API 키를 입력하세요
}

data = {
    "text": "${content}",
    "language": "${lang}",
    "speaker": "${voice}",
${instructLine}}

response = requests.post(url, headers=headers, json=data, timeout=60)
response.raise_for_status()

with open("output.mp3", "wb") as f:
    f.write(response.content)
print("saved: output.mp3")
`;
}
