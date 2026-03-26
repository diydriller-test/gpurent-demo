/**
 * 로컬 테스트용: 게이트웨이(11115) 대신 OpenAI 호환 vLLM 서버에 직접 연결합니다.
 * Python 예시와 동일하게 base URL + OPENAI_API_KEY(.env)를 사용합니다.
 */
export const DEFAULT_VLLM_BASE_URL = "http://gpurent.kogrobo.com:51089/v1";

export function getVllmOpenAiConfig(): { baseURL: string; apiKey: string } {
  const baseURL = (
    process.env.VLLM_BASE_URL?.trim() || DEFAULT_VLLM_BASE_URL
  ).replace(/\/$/, "");
  const apiKey = process.env.OPENAI_API_KEY ?? "";
  return { baseURL, apiKey };
}
