import { redirect } from "next/navigation";

type ResetPasswordRedirectPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** 레거시 `/reset-password` → 이메일 링크와 동일한 `/auth/reset-password` */
export default async function ResetPasswordRedirectPage({
  searchParams,
}: ResetPasswordRedirectPageProps) {
  const params = await searchParams;
  const qs = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      qs.set(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((v) => qs.append(key, v));
    }
  }

  const suffix = qs.toString();
  redirect(suffix ? `/auth/reset-password?${suffix}` : "/auth/reset-password");
}
