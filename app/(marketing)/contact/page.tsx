import { Mail, MapPin } from "lucide-react";
import { company } from "@/lib/company";
import { Card, CardContent } from "@/components/ui/card";

export default function ContactPage() {
  const emails = [
    ["البريد العام", company.emails.general],
    ["المبيعات", company.emails.sales],
    ["التشغيل", company.emails.ops],
    ["الفواتير", company.emails.billing],
    ["المدير العام", company.emails.manager],
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="font-bold text-accent">تواصل معنا</p>
      <h1 className="mt-3 text-4xl font-bold text-primary">فريق QBL جاهز لمناقشة احتياجك التشغيلي</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card className="rounded-lg">
          <CardContent className="p-6">
            <MapPin className="h-6 w-6 text-accent" />
            <h2 className="mt-4 font-bold text-primary">العنوان</h2>
            <p className="mt-3 leading-8 text-muted-foreground">{company.address}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardContent className="p-6">
            <Mail className="h-6 w-6 text-accent" />
            <h2 className="mt-4 font-bold text-primary">البريد الإلكتروني</h2>
            <div className="mt-3 grid gap-2 text-sm">
              {emails.map(([label, email]) => (
                <a key={email} href={`mailto:${email}`} className="flex justify-between gap-4 rounded-md border px-3 py-2 hover:bg-muted">
                  <span>{label}</span><span className="ltr">{email}</span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
