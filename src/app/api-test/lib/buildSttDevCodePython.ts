function escapeForPythonDoubleQuoted(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function buildSttDevCodePython({
  language,
  task,
  beamSize,
  vadOn,
  url,
}: {
  language: string;
  task: string;
  beamSize: number;
  vadOn: boolean;
  url: string;
}) {
  const lang = escapeForPythonDoubleQuoted(language);
  const taskSafe = escapeForPythonDoubleQuoted(task);
  const beam = Number.isFinite(beamSize)
    ? Math.min(5, Math.max(1, Math.round(beamSize)))
    : 1;
  const vadStr = vadOn ? "true" : "false";

  return `import requests
import time

# 1. API 설정
url = "${url}"
headers = {
    "Authorization": "Bearer YOUR_API_KEY"  # 발급받은 API 키를 여기에 입력하세요
}

# 2. 음성 파일 및 옵션 설정
# 'path/to/your/voice_file.wav' 부분을 실제 파일 경로로 수정하세요.
file_path = "path/to/your/voice_file.wav"

try:
    with open(file_path, "rb") as f:
        files = {"file": (file_path, f, "audio/wav")}
        data = {
            "language": "${lang}",
            "task": "${taskSafe}",
            "beam_size": ${beam},
            "vad_filter": "${vadStr}",
        }

        # 3. API 호출 및 시간 측정
        print(f"음성 변환 중... (파일: {file_path})")
        start_time = time.time()

        resp = requests.post(url, headers=headers, files=files, data=data, timeout=600)
        resp.raise_for_status()

        duration = time.time() - start_time
        result = resp.json()

        # 4. 결과 출력
        print("\\n" + "=" * 30)
        print(f"인식 결과: {result.get('text')}")
        print(f"소요 시간: {duration:.2f}s")
        print("=" * 30)

except FileNotFoundError:
    print(f"에러: 파일을 찾을 수 없습니다. 경로를 확인해주세요: {file_path}")
except Exception as e:
    print(f"에러 발생: {e}")
`;
}
