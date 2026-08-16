import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/PageHeader";
import { AdminPayrollClient } from "@/components/admin/AdminPayrollClient";
import { getPayrollOverviews } from "@/lib/services/payroll";

export default async function AdminPayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const now = new Date();
  const year = parseInt(params.year ?? String(now.getFullYear()), 10);
  const month = parseInt(params.month ?? String(now.getMonth() + 1), 10);

  const overviews = await getPayrollOverviews(supabase, year, month);

  return (
    <div className="space-y-6">
      <PageHeader title="급여 정산" description="월별 급여 정산을 관리합니다" />
      <AdminPayrollClient initialOverviews={overviews} initialYear={year} initialMonth={month} />
    </div>
  );
}
