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

  return `import base64
import json
import requests

# 1. API 설정
url = "${url}/_inference/image2text"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",  # 발급받은 API 키를 입력하세요
    "Content-Type": "application/json",
}

# 2. 이미지 파일을 base64로 변환
image_path = "path/to/your/image.jpg"  # 분석할 이미지 파일 경로 (JPG, PNG, WebP 등)
with open(image_path, "rb") as f:
    image_b64 = base64.b64encode(f.read()).decode("utf-8")
data_url = f"data:image/jpeg;base64,{image_b64}"

# 3. 요청 데이터 설정
data = {
    "model": "google/gemma-4-26b-a4b-it",
    "temperature": ${temperature},  # 생성 다양성 (0.0~1.0, 낮을수록 일관된 결과)
    "messages": [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "${safePrompt}"},  # 이미지에 대한 분석 지시
                {"type": "image_url", "image_url": {"url": data_url}},  # base64 인코딩된 이미지
            ],
        }
    ],
}

# 4. API 호출
response = requests.post(url, headers=headers, data=json.dumps(data), timeout=120)
response.raise_for_status()
result = response.json()

# 5. 결과 출력
print(result["choices"][0]["message"]["content"])
`;
}
