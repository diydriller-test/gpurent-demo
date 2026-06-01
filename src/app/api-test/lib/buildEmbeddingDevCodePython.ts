function escapeForPythonJsonString(s: string) {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
}

export function buildEmbeddingDevCodePython({ inputText, url, apiKey = "YOUR_API_KEY" }: { inputText: string; url: string; apiKey?: string }) {
  const content = escapeForPythonJsonString(
    inputText.trim() || "안녕하세요. 만나서 반갑습니다.",
  );

  return `import requests

# 1. API 설정
url = "${url}/_inference/text_embedding/qwen3"
headers = {
    "Authorization": "Bearer ${apiKey}",  # 발급받은 API 키를 입력하세요
    "Content-Type": "application/json",
}

# 2. 요청 데이터 설정
data = {
    "input": "${content}",  # 벡터로 변환할 텍스트
    "input_type": "string",  # 입력 타입
    "task_settings": {},     # 추가 설정 (기본값 사용)
}

# 3. API 호출
response = requests.post(url, headers=headers, json=data)
response.raise_for_status()

result = response.json()

# 4. 결과 출력
embedding_vector = result["inference_results"][0]["text_embedding"]
print(f"벡터 차원: {len(embedding_vector)}")
print(f"앞 5개 값: {embedding_vector[:5]}")
`;
}
