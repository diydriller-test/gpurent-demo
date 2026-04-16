import { escapeForPythonJsonString } from "./escapeForPythonJsonString";

const URL = "http://gpurent.kogrobo.com:11115/_inference/rerank/qwen3";

function sanitizeDocLine(line: string): string {
  return line.trim().replace(/^-+\s*/, "");
}

export function buildRerankDevCodePython({
  query,
  docLines,
}: {
  query: string;
  docLines: string[];
}) {
  const q = escapeForPythonJsonString(query.trim() || "여행 추천");
  const lines = docLines.map(sanitizeDocLine).filter(Boolean);
  const inputs =
    lines.length > 0
      ? lines.map((line) => `"${escapeForPythonJsonString(line)}"`)
      : [
          '"제주도 한달살기"',
          '"삿포로 눈축제"',
          '"도쿄 디즈니씨"',
          '"비오는 날 듣는 음악"',
          '"파스타 레시피"',
          '"타이베이 버블티 맛집"',
          '"프랑스 남부"',
        ];

  return `import requests
import json

# 1. API 설정
url = "${URL}"
headers = {
    "access_token": "YOUR_API_KEY",
    "Content-Type": "application/json"
}

# 2. 요청 데이터 구성
data = {
    "query": "${q}",
    "input": [
        ${inputs.join(",\n        ")}
    ],
    "task_settings": {}
}

# 3. API 호출 및 결과 처리
response = requests.post(url, headers=headers, data=json.dumps(data))
result = response.json()

# 리랭킹 결과 리스트 가져오기
rerank_results = result.get('rerank', [])

# 🔥 점수(relevance_score)가 높은 순서대로 정렬 (내림차순)
# API 응답 필드명이 'score'인 경우 x['score']로 수정하세요.
sorted_results = sorted(rerank_results, key=lambda x: x['relevance_score'], reverse=True)

# 4. 보기 좋게 출력
print(f"🔍 질문: {data['query']}\\n")
print("-" * 50)
for idx, res in enumerate(sorted_results):
    score = res['relevance_score']
    # 원본 리스트의 인덱스를 통해 텍스트 매칭
    text = data['input'][res['index']]
    print(f"Rank {idx+1} | Score: {score:.4f} | {text}")
print("-" * 50)
`;
}
