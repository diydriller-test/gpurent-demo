const URL = "https://api.kogrobo.com/gateway/api/image2text";

function escapeForPythonDoubleQuoted(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

export function buildImage2TextDevCodePython({
  prompt,
}: {
  prompt: string;
  temperature: number;
}) {
  const safePrompt = escapeForPythonDoubleQuoted(prompt.trim());

  return `import requests

# 1. API 설정
url = "${URL}"
headers = {
    "Authorization": "Bearer YOUR_API_KEY"  # 발급받은 API 키를 입력하세요
}

# 2. 이미지 파일 및 프롬프트 설정
image_path = "path/to/your/image.jpg"

with open(image_path, "rb") as f:
    files = {"image": (image_path, f)}
    data = {"prompt": "${safePrompt}"}

    # 3. API 호출 및 결과 출력
    response = requests.post(url, headers=headers, files=files, data=data, timeout=120)
    response.raise_for_status()
    result = response.json()

print(result["text"])
`;
}
