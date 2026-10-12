import type { Metadata } from "next";
import { PasswordChangeForm } from "@/components/admin/password-change-form";
import { requireAdminPage } from "@/lib/admin/guard";
import { getPrisma } from "@/lib/prisma";
import { roleLabel } from "@/lib/workspace";

export const metadata: Metadata = {
  title: "حسابي | QBL",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const session = await requireAdminPage();
  const user = process.env.DATABASE_URL
    ? await getPrisma().user.findUnique({ where: { id: session.userId }, select: { email: true } })
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">حسابي</h1>
        <p className="mt-1 text-sm text-slate-500">
          {user?.email ? (
            <>
              الحساب: <span dir="ltr" className="font-medium text-slate-700">{user.email}</span> ·{" "}
            </>
          ) : null}
          الدور: {roleLabel(session.role)}
        </p>
      </div>
      <section className="rounded-lg border bg-white p-6">
        <h2 className="mb-1 text-base font-semibold text-slate-900">تغيير كلمة المرور</h2>
        <p className="mb-5 text-sm text-slate-500">
          الكلمة الجديدة تُحفظ مشفّرة مباشرة، ولا تظهر لأي أحد ولا تُسجَّل في أي مكان.
        </p>
        <PasswordChangeForm />
      </section>
    </div>
  );
}
