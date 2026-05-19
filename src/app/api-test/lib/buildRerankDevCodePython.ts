import { escapeForPythonJsonString } from "./escapeForPythonJsonString";

function sanitizeDocLine(line: string): string {
  return line.trim().replace(/^-+\s*/, "");
}

export function buildRerankDevCodePython({
  query,
  docLines,
  url,
}: {
  query: string;
  docLines: string[];
  url: string;
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
url = "${url}"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",  # 발급받은 API 키를 입력하세요
    "Content-Type": "application/json",
}

# 2. 요청 데이터 설정
data = {
    "query": "${q}",  # 검색 질의문
    "input": [        # 재정렬할 문서 리스트
        ${inputs.join(",\n        ")}
    ],
}

# 3. API 호출
response = requests.post(url, headers=headers, data=json.dumps(data))
response.raise_for_status()

result = response.json()

# 4. 결과 출력 (relevance_score 높은 순 정렬)
rerank_results = result.get("rerank", [])
sorted_results = sorted(rerank_results, key=lambda x: x["relevance_score"], reverse=True)

print(f"질문: {data['query']}\\n")
print("-" * 50)
for idx, res in enumerate(sorted_results):
    score = res["relevance_score"]
    text = data["input"][res["index"]]
    print(f"Rank {idx+1} | Score: {score:.4f} | {text}")
print("-" * 50)
`;
}
