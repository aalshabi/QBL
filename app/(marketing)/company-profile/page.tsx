import { Building2, Mail, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { company, differentiators, services } from "@/lib/company";

export default function CompanyProfilePage() {
  return (
    <main className="print-profile">
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <Badge className="bg-accent text-accent-foreground">Company Profile</Badge>
            <h1 className="mt-4 text-4xl font-bold text-primary">{company.officialName}</h1>
            <p className="mt-3 text-lg text-muted-foreground ltr text-right">{company.tradeName} · {company.abbreviation}</p>
          </div>
          <Button variant="outline" className="no-print">
            <Printer className="h-4 w-4" />
            اطبع من المتصفح
          </Button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["القطاع", company.sector],
            ["المقر", company.headquarters],
            ["سنة التأسيس", String(company.foundedYear)],
          ].map(([label, value]) => (
            <Card key={label} className="rounded-lg">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 font-bold text-primary">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>الرؤية والرسالة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
              <p><strong className="text-primary">الرؤية:</strong> {company.vision}</p>
              <p><strong className="text-primary">الرسالة:</strong> {company.mission}</p>
              <p><strong className="text-primary">الوعد:</strong> {company.promise}</p>
            </CardContent>
          </Card>
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>معلومات رسمية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p><Building2 className="ms-2 inline h-4 w-4 text-accent" />{company.address}</p>
              <p>السجل التجاري: <span className="font-mono">{company.crNumber}</span></p>
              <p>الرقم الموحد: <span className="font-mono">{company.unifiedNumber}</span></p>
              <p>المدير العام: {company.generalManager}</p>
              <p><Mail className="ms-2 inline h-4 w-4 text-accent" />{company.emails.manager}</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <Card className="rounded-lg">
            <CardHeader><CardTitle>الخدمات</CardTitle></CardHeader>
            <CardContent className="grid gap-2 text-sm">
              {services.map((service) => <p key={service.title}>• {service.title}</p>)}
            </CardContent>
          </Card>
          <Card className="rounded-lg">
            <CardHeader><CardTitle>نقاط التميز</CardTitle></CardHeader>
            <CardContent className="grid gap-2 text-sm">
              {differentiators.map((item) => <p key={item}>• {item}</p>)}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
