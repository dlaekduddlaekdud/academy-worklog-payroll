/**
 * Next.js의 redirect()는 NEXT_REDIRECT 예외를 던져서 동작한다.
 * 서버 액션 전체를 try/catch로 감싸면 이 예외까지 잡혀서 리다이렉트가
 * 일어나지 않고 { success: false, error: "NEXT_REDIRECT" }가 반환된다.
 * catch 블록 첫 줄에서 이 함수로 걸러 다시 던져야 한다.
 */
export function rethrowIfRedirect(e: unknown): void {
  if (
    typeof e === "object" &&
    e !== null &&
    "digest" in e &&
    typeof (e as { digest: unknown }).digest === "string" &&
    (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  ) {
    throw e;
  }
}
