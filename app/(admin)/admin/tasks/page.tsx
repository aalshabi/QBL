import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireAdminPage } from "@/lib/admin/guard";
import {
  LOGESTECHS_TASK,
  TASK_DECISIONS,
  TASK_PHASES,
  TASK_TESTS,
  activePhase,
  gapsByPriority,
  isOverdue,
  riyadhToday,
  summarize,
  windowProgress,
  type DecisionStatus,
  type TaskGap,
  type TaskOwner,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks/logestechs-integration";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "المهام الحرجة | QBL",
  robots: { index: false, follow: false },
};

// التاريخ الميلادي صراحةً: ar-SA يعرض الهجري افتراضياً، ومواعيد المهمة ميلادية.
const dayMonth = new Intl.DateTimeFormat("ar-SA-u-ca-gregory", { day: "numeric", month: "long", timeZone: "UTC" });
const num = new Intl.NumberFormat("ar-SA");

function formatDay(value: string): string {
  return dayMonth.format(new Date(`${value}T00:00:00Z`));
}

const statusLabels: Record<TaskStatus, string> = {
  OPEN: "لم يبدأ",
  IN_PROGRESS: "قيد التنفيذ",
  BLOCKED: "متوقف",
  DONE: "منجز",
};

const statusStyles: Record<TaskStatus, string> = {
  OPEN: "bg-slate-100 text-slate-700 border-slate-200",
  IN_PROGRESS: "bg-sky-100 text-sky-800 border-sky-200",
  BLOCKED: "bg-rose-100 text-rose-800 border-rose-200",
  DONE: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const decisionLabels: Record<DecisionStatus, string> = {
  PENDING: "بانتظار القرار",
  APPROVED: "معتمد",
  REJECTED: "مرفوض",
};

const decisionStyles: Record<DecisionStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  REJECTED: "bg-zinc-200 text-zinc-600 border-zinc-300",
};

const priorityNotes: Record<TaskPriority, string> = {
  P0: "يوقف التشغيل الموثوق — يُنجز أولًا",
  P1: "يلي استقرار التدفق الأساسي",
  P2: "مؤجل حتى نجاح الاختبار الكامل",
};

function Owners({ owners }: { owners: TaskOwner[] }) {
  return (
    <ul className="space-y-1">
      {owners.map((owner) => (
        <li key={owner.name} className="whitespace-nowrap">
          <span className="font-medium">{owner.name}</span>{" "}
          <span className={cn("text-xs", owner.confirmed ? "text-emerald-700" : "text-amber-700")}>
            {owner.confirmed ? "مؤكد" : "يحتاج اعتماد"}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "alert" | "ok" }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-slate-500">{label}</p>
        <p
          className={cn(
            "mt-1 text-2xl font-bold",
            tone === "alert" ? "text-rose-700" : tone === "ok" ? "text-emerald-700" : "text-[#0D1B3A]",
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function GapTable({ gaps, today }: { gaps: TaskGap[]; today: string }) {
  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-start">البند</TableHead>
              <TableHead className="text-start">الإجراء</TableHead>
              <TableHead className="text-start">المالك المقترح</TableHead>
              <TableHead className="text-start">الموعد</TableHead>
              <TableHead className="text-start">معيار القبول</TableHead>
              <TableHead className="text-start">الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gaps.map((gap) => {
              const overdue = isOverdue(gap, today);
              return (
                <TableRow key={gap.id} className="align-top">
                  <TableCell className="min-w-52 whitespace-normal">
                    <span className="text-xs text-slate-400">{gap.id}</span>
                    <p className="font-medium">{gap.problem}</p>
                  </TableCell>
                  <TableCell className="min-w-64 text-sm whitespace-normal">{gap.action}</TableCell>
                  <TableCell className="text-sm">
                    <Owners owners={gap.owners} />
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {gap.due ? (
                      <span className={cn(overdue && "font-semibold text-rose-700")}>
                        {formatDay(gap.due)}
                        {overdue ? " — متأخر" : ""}
                      </span>
                    ) : (
                      <span className="text-slate-500">{gap.dueNote ?? "—"}</span>
                    )}
                  </TableCell>
                  <TableCell className="min-w-56 text-sm whitespace-normal text-slate-600">{gap.acceptance}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("font-medium", statusStyles[gap.status])}>
                      {statusLabels[gap.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default async function AdminTasksPage() {
  await requireAdminPage();

  const today = riyadhToday();
  const summary = summarize(today);
  const progress = windowProgress(today);
  const current = activePhase(today);
  const priorities: TaskPriority[] = ["P0", "P1", "P2"];

  const progressLabel =
    progress.state === "BEFORE"
      ? "لم تبدأ النافذة"
      : progress.state === "ENDED"
        ? "انتهت النافذة"
        : `اليوم ${num.format(progress.day)} من ${num.format(progress.total)}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-rose-200 bg-rose-100 font-semibold text-rose-800">
              حرجة {LOGESTECHS_TASK.priority}
            </Badge>
            <span className="text-xs text-slate-500">
              {formatDay(LOGESTECHS_TASK.windowStart)} – {formatDay(LOGESTECHS_TASK.windowEnd)} · {progressLabel}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-[#0D1B3A]">{LOGESTECHS_TASK.title}</h1>
          <p className="mt-1 text-sm text-slate-600">{LOGESTECHS_TASK.goal}</p>
        </div>
        <p className="text-xs text-slate-500">آخر تحديث: {formatDay(LOGESTECHS_TASK.updatedAt)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="بنود P0 المفتوحة" value={`${num.format(summary.p0Open)} / ${num.format(summary.p0Total)}`} />
        <Stat
          label="بنود متأخرة"
          value={num.format(summary.overdue)}
          tone={summary.overdue > 0 ? "alert" : "ok"}
        />
        <Stat label="قرارات بانتظار الاعتماد" value={num.format(summary.pendingDecisions)} />
        <Stat label="مالكون لم يؤكدوا" value={num.format(summary.unconfirmedOwners)} />
        <Stat
          label="اختبارات ناجحة"
          value={`${num.format(summary.testsPassed)} / ${num.format(summary.testsTotal)}`}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            المراجعة اليومية — {LOGESTECHS_TASK.dailyReview.time}
            {current ? ` · المرحلة الحالية: ${current.label}` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="grid list-inside list-decimal gap-x-6 gap-y-1 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
            {LOGESTECHS_TASK.dailyReview.questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Tabs defaultValue="gaps">
        <TabsList>
          <TabsTrigger value="gaps">البنود</TabsTrigger>
          <TabsTrigger value="plan">خطة 30 يومًا</TabsTrigger>
          <TabsTrigger value="decisions">القرارات</TabsTrigger>
          <TabsTrigger value="tests">الاختبارات</TabsTrigger>
        </TabsList>

        <TabsContent value="gaps" className="space-y-4">
          {priorities.map((priority) => (
            <section key={priority} className="space-y-2">
              <h2 className="text-sm font-semibold text-[#0D1B3A]">
                {priority} <span className="font-normal text-slate-500">— {priorityNotes[priority]}</span>
              </h2>
              <GapTable gaps={gapsByPriority(priority)} today={today} />
            </section>
          ))}
        </TabsContent>

        <TabsContent value="plan">
          <div className="grid gap-3 lg:grid-cols-2">
            {TASK_PHASES.map((phase) => {
              const isCurrent = current?.id === phase.id;
              return (
                <Card key={phase.id} className={cn(isCurrent && "border-[#00A7B6] ring-1 ring-[#00A7B6]")}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                      <span>{phase.label}</span>
                      <span className="text-xs font-normal text-slate-500">
                        {formatDay(phase.start)} – {formatDay(phase.end)}
                        {isCurrent ? " · الحالية" : ""}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <ul className="list-inside list-disc space-y-1 text-slate-700">
                      {phase.deliverables.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <Owners owners={phase.owners} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="decisions">
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-start">#</TableHead>
                    <TableHead className="text-start">القرار</TableHead>
                    <TableHead className="text-start">لماذا يحتاج موافقة</TableHead>
                    <TableHead className="text-start">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TASK_DECISIONS.map((decision) => (
                    <TableRow key={decision.id} className="align-top">
                      <TableCell className="text-xs text-slate-400">{decision.id}</TableCell>
                      <TableCell className="min-w-64 font-medium whitespace-normal">{decision.decision}</TableCell>
                      <TableCell className="min-w-56 text-sm whitespace-normal text-slate-600">{decision.why}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("font-medium", decisionStyles[decision.status])}>
                          {decisionLabels[decision.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests">
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-start">#</TableHead>
                    <TableHead className="text-start">الاختبار</TableHead>
                    <TableHead className="text-start">الطريقة</TableHead>
                    <TableHead className="text-start">النتيجة المقبولة</TableHead>
                    <TableHead className="text-start">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TASK_TESTS.map((item) => (
                    <TableRow key={item.id} className="align-top">
                      <TableCell className="text-xs text-slate-400">{item.id}</TableCell>
                      <TableCell className="font-medium whitespace-normal">{item.name}</TableCell>
                      <TableCell className="min-w-56 text-sm whitespace-normal">{item.method}</TableCell>
                      <TableCell className="min-w-48 text-sm whitespace-normal text-slate-600">{item.accepted}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-medium",
                            item.passed
                              ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                              : "border-slate-200 bg-slate-100 text-slate-700",
                          )}
                        >
                          {item.passed ? "نجح" : "لم يُنفَّذ"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-slate-500">
        المرجع الكامل: <span dir="ltr">{LOGESTECHS_TASK.reference}</span> في مستودع المشروع. الحالات هنا تُحدَّث مع كل
        نشر، ولا يُكتب «منجز» قبل تحقق معيار القبول.
      </p>
    </div>
  );
}
