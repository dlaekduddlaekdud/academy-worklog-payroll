import { CreateWorkerForm } from "@/components/admin/CreateWorkerForm";

export default function NewWorkerPage() {
  return (
    <div className="max-w-lg p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">근무자 등록</h1>
        <p className="mt-1 text-muted-foreground">
          계정을 만든 뒤 초기 비밀번호를 근무자에게 전달한다. 근무자가 직접 가입할 수 있는 경로는
          없다.
        </p>
      </div>

      <CreateWorkerForm />
    </div>
  );
}
