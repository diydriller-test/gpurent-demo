const URL =
  "https://aiapi.kogrobo.com/gateway/_inference/text_embedding/qwen3";

function escapeForPythonJsonString(s: string) {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
}

/**
 * Embedding Workstation 전용 포트 — `/api/embedding` 프록시와 동일한 업스트림 형식.
 */
export function buildEmbeddingDevCodePython({ inputText }: { inputText: string }) {
  const content = escapeForPythonJsonString(
    inputText.trim() || "안녕하세요. 만나서 반갑습니다.",
  );

  return `import requests

# 1. API 설정 (Embedding Workstation 전용 포트)
url = "${URL}"
headers = {
    "access_token": "YOUR_API_KEY",  # 발급받은 API 키를 입력하세요
    "Content-Type": "application/json"
}

# 2. 요청 데이터 구성 (문장을 고차원 벡터로 변환)
data = {
    "input": "${content}",
    "input_type": "query",  # 또는 "document"
    "task_settings": {}
}

# 3. API 호출 및 결과 출력
response = requests.post(url, headers=headers, json=data)
result = response.json()

# 4,096차원의 임베딩 벡터 추출
embedding_vector = result['inference_results'][0]['text_embedding']

print(f"Vector Dimension: {len(embedding_vector)}")
print(f"First 5 values: {embedding_vector[:5]}")
`;
}
