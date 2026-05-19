function escapeForPythonDoubleQuoted(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

export function buildImage2TextDevCodePython({
  prompt,
  temperature,
  url,
}: {
  prompt: string;
  temperature: number;
  url: string;
}) {
  const safePrompt = escapeForPythonDoubleQuoted(prompt.trim());

  return `import requests

# 1. API 설정
url = "${url}"
headers = {
    "Authorization": "Bearer YOUR_API_KEY"  # 발급받은 API 키를 입력하세요
}

# 2. 이미지 파일 및 프롬프트 설정
image_path = "path/to/your/image.jpg"

with open(image_path, "rb") as f:
    files = {"image": (image_path, f)}
    data = {
        "prompt": "${safePrompt}",  # 이미지에 대한 분석 지시
        "temperature": "${temperature}",  # 생성 다양성 (0.0~1.0, 낮을수록 안정적)
    }

    # 3. API 호출 및 결과 출력
    response = requests.post(url, headers=headers, files=files, data=data, timeout=120)
    response.raise_for_status()
    result = response.json()

print(result["text"])
`;
}
