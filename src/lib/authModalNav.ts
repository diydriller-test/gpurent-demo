type AuthModalRouter = {
  replace: (href: string) => void;
  push: (href: string, options?: { scroll?: boolean }) => void;
};

/** 비밀번호 재설정 후 메인을 배경으로 두고 로그인 모달을 연다. */
export function navigateToLoginAfterPasswordReset(router: AuthModalRouter) {
  sessionStorage.setItem("modalScrollY", "0");
  router.replace("/");
  requestAnimationFrame(() => {
    router.push("/login?reset=1", { scroll: false });
  });
}
