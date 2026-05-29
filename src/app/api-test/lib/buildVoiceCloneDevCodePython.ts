function escapeForPythonDoubleQuoted(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function buildVoiceCloneDevCodePython({
  text,
  language,
  xVectorOnly,
  refText,
  url,
}: {
  text: string;
  language: string;
  xVectorOnly: boolean;
  refText: string;
  url: string;
}) {
  const textSafe = escapeForPythonDoubleQuoted(text.trim() || "안녕하세요. 보이스 클론 테스트입니다.");
  const langSafe = escapeForPythonDoubleQuoted(language || "Korean");
  const refTextSafe = escapeForPythonDoubleQuoted(refText.trim());
  const xVectorStr = xVectorOnly ? "true" : "false";
  const refTextLine = !xVectorOnly && refTextSafe
    ? `    "ref_text": "${refTextSafe}",    # 참조 음성에서 말하는 내용\n`
    : "";

  return `import os
import requests
import random

# 1. API 설정 - 요청마다 고유한 랜덤 ID 생성
rand = random.randint(0, 999_999_999)
url = f"${url}/_inference/tts/{rand}"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",  # 발급받은 API 키를 입력하세요
}

# 2. 참조 음성 파일 경로 설정 (클론할 목소리 샘플, WAV 권장 5~30초)
ref_audio_path = "path/to/your/reference_voice.wav"  # 실제 파일 경로로 수정하세요

# 3. 요청 데이터 설정
data = {
    "text": "${textSafe}",              # 클론된 목소리로 읽어줄 텍스트
    "language": "${langSafe}",          # 언어 설정 (Korean, English, Japanese 등)
    "x_vector_only_mode": "${xVectorStr}",  # true: 목소리 톤만 클론 / false: 운율·억양까지 클론
${refTextLine}}

# 4. API 호출
with open(ref_audio_path, "rb") as f:
    files = {"ref_audio": (os.path.basename(ref_audio_path), f, "audio/wav")}
    response = requests.post(url, headers=headers, data=data, files=files, timeout=120)

response.raise_for_status()

# 5. 결과 저장 (wb: write binary)
with open("cloned_output.wav", "wb") as f:
    f.write(response.content)
print("saved: cloned_output.wav")
`;
}
