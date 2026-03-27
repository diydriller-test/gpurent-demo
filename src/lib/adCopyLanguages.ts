/** Ad Copy API — 출력 언어 코드 (BCP-47 계열) */
export const AD_COPY_LANGUAGE_OPTIONS = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
  { value: "zh", label: "中文 (简体)" },
  { value: "zh-TW", label: "中文 (繁體)" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "vi", label: "Tiếng Việt" },
  { value: "th", label: "ไทย" },
  { value: "id", label: "Bahasa Indonesia" },
  { value: "pt", label: "Português" },
  { value: "ru", label: "Русский" },
  { value: "ar", label: "العربية" },
] as const;

export const DEFAULT_AD_COPY_LANGUAGE = "ko";

const ALLOWED = new Set(
  AD_COPY_LANGUAGE_OPTIONS.map((o) => o.value) as string[],
);

export function isAdCopyLanguageCode(value: string): boolean {
  return ALLOWED.has(value.trim());
}

/** UI 라벨 또는 그대로 표시용 */
export function getAdCopyLanguageLabel(value: string): string {
  const v = value.trim();
  const hit = AD_COPY_LANGUAGE_OPTIONS.find((o) => o.value === v);
  return hit?.label ?? v;
}
