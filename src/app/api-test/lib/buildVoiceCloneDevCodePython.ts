const URL = "http://aiapi.kogrobo.com/gateway/voiceclone/_inference/tts/my_inference";

function escapeForPythonDoubleQuoted(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function buildVoiceCloneDevCodePython({
  text,
  language,
  xVectorOnly,
  refText,
}: {
  text: string;
  language: string;
  xVectorOnly: boolean;
  refText: string;
}) {
  const textSafe = escapeForPythonDoubleQuoted(text.trim() || "안녕하세요. 보이스 클론 테스트입니다.");
  const langSafe = escapeForPythonDoubleQuoted(language || "Korean");
  const refTextSafe = escapeForPythonDoubleQuoted(refText.trim());
  const xVectorStr = xVectorOnly ? "True" : "False";
  const refTextLine = !xVectorOnly && refTextSafe
    ? `        "ref_text": "${refTextSafe}",\n`
    : "";

  return `import os
import requests

# 1. API 설정
url = "${URL}"
headers = {
    "access_token": "YOUR_API_KEY"  # 발급받은 API 키를 입력하세요
}

# 2. 참조 음성 파일 경로 설정 (클론할 목소리 샘플)
ref_audio = "path/to/your/reference_voice.wav"

text = "${textSafe}"
language = "${langSafe}"
x_vector_only_mode = ${xVectorStr}

if not os.path.exists(ref_audio):
    raise FileNotFoundError(f"참조 음성 파일을 찾을 수 없습니다: {ref_audio}")

data = {
    "text": text,
    "language": language,
    "x_vector_only_mode": "true" if x_vector_only_mode else "false",
${refTextLine}}

with open(ref_audio, "rb") as f:
    files = {"ref_audio": (os.path.basename(ref_audio), f, "audio/wav")}
    resp = requests.post(url, headers=headers, data=data, files=files, timeout=120)

if resp.ok:
    with open("cloned_output.wav", "wb") as out:
        out.write(resp.content)
    print("저장 완료: cloned_output.wav")
else:
    print("오류:", resp.text)
`;
}
