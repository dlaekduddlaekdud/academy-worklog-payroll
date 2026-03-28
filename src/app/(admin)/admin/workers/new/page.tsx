import Link from "next/link";

// Google OAuth 방식에서는 근무자가 직접 Google 로그인으로 자동 등록됨
export default function NewWorkerPage() {
  return (
    <div className="p-6 max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">근무자 등록 안내</h1>
        <p className="text-muted-foreground mt-1">
          Google 로그인 방식에서는 근무자가 직접 로그인하면 자동으로 등록됩니다.
        </p>
      </div>

      <div className="rounded-lg border p-5 space-y-4 bg-muted/40">
        <h2 className="font-semibold">근무자 등록 방법</h2>
        <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
          <li>근무자에게 서비스 URL을 전달합니다.</li>
          <li>근무자가 본인의 Google 계정으로 로그인합니다.</li>
          <li>
            로그인 후 자동으로 근무자 계정이 생성되며,{" "}
            <span className="text-foreground font-medium">근무자 목록</span>
            에 나타납니다.
          </li>
          <li>시급은 근무자 목록에서 설정할 수 있습니다.</li>
        </ol>
      </div>

      <div className="mt-6">
        <Link
          href="/admin/workers"
          className="text-sm text-primary underline underline-offset-4"
        >
          ← 근무자 목록으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
