import { escapeForPythonJsonString } from "./escapeForPythonJsonString";

export function buildT2iDevCodePython({
  prompt,
  negativePrompt,
  width,
  height,
  seed,
  imageFileName,
  url,
}: {
  prompt: string;
  negativePrompt: string;
  width: number;
  height: number;
  seed: string;
  imageFileName: string | null;
  url: string;
}) {
  const safePrompt = escapeForPythonJsonString(
    prompt.trim() || "A serene mountain landscape at sunset, photorealistic, 8k",
  );
  const safeNeg = escapeForPythonJsonString(negativePrompt.trim());
  const negLine = safeNeg
    ? `data["negative_prompt"] = "${safeNeg}"  # 제외할 요소\n`
    : `# data["negative_prompt"] = "blurry, low quality"  # 제외할 요소 (선택)\n`;
  const seedValue = seed !== "" ? Number(seed) : -1;
  const seedComment = seedValue === -1 ? "  # -1이면 매번 다른 결과" : "  # 재현 가능한 고정 시드";

  if (imageFileName) {
    const safeFileName = escapeForPythonJsonString(imageFileName);
    return `import random
import requests

# 1. API 설정 - 요청마다 고유한 랜덤 ID 생성
rand = random.randint(0, 999_999_999)
url = f"${url}/image/_inference/image-edit/{rand}"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",  # 발급받은 API 키를 입력하세요
}

# 2. 요청 데이터 설정 (이미지 편집 모드 - multipart/form-data)
image_path = "${safeFileName}"  # 편집할 원본 이미지 파일 경로
data = {
    "prompt": "${safePrompt}",  # 편집 방향 프롬프트
    ${negLine.trimEnd()}
    "width": ${width},           # 출력 이미지 가로 크기
    "height": ${height},          # 출력 이미지 세로 크기
    "num_inference_steps": 10,   # 추론 스텝 수 (높을수록 품질↑, 속도↓)
    "seed": ${seedValue},${seedComment}
}

# 3. API 호출 (이미지 파일을 multipart로 전송)
with open(image_path, "rb") as f:
    files = {"image": f}
    response = requests.post(url, headers=headers, data=data, files=files, timeout=300)
response.raise_for_status()

# 4. 결과 저장
with open("output.png", "wb") as f:
    f.write(response.content)
print("saved: output.png")
`;
  }

  return `import random
import requests

# 1. API 설정 - 요청마다 고유한 랜덤 ID 생성
rand = random.randint(0, 999_999_999)
url = f"${url}/image/_inference/image-edit/{rand}"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",  # 발급받은 API 키를 입력하세요
}

# 2. 요청 데이터 설정 (텍스트→이미지 생성 모드 - multipart/form-data)
data = {
    "prompt": "${safePrompt}",  # 생성할 이미지 설명
    ${negLine.trimEnd()}
    "width": ${width},           # 이미지 가로 크기 (px)
    "height": ${height},          # 이미지 세로 크기 (px)
    "num_inference_steps": 10,   # 추론 스텝 수 (높을수록 품질↑, 속도↓)
    "seed": ${seedValue},${seedComment}
}

# 3. API 호출 (이미지 없이 전송 → 신규 생성)
response = requests.post(url, headers=headers, data=data, timeout=300)
response.raise_for_status()

# 4. 결과 저장
with open("output.png", "wb") as f:
    f.write(response.content)
print("saved: output.png")

# 이미지 편집 모드: 원본 이미지를 함께 전송하면 해당 이미지를 기반으로 편집합니다.
# with open("input.png", "rb") as f:
#     response = requests.post(url, headers=headers, data=data, files={"image": f}, timeout=300)
`;
}
