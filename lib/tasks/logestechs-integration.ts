/**
 * المهمة الحرجة: تكامل LogesTechs مع qbl.sa — نسخة العرض في مساحة عمل الفريق.
 *
 * المصدر هو LOGESTECHS_QBL_TASK.md في جذر المستودع؛ هذا الملف يحمل الأجزاء التي
 * يتابعها الفريق يومياً (الفجوات، المراحل، القرارات، الاختبارات) كبيانات مطبوعة.
 *
 * قواعد المحتوى (يحميها tests/critical-task.test.ts):
 * - لا مفاتيح ولا كلمات مرور ولا بيانات عملاء (أسماء، جوالات، عناوين).
 * - المالك «مقترح» حتى يؤكد صاحبه؛ لا يُكتب مؤكداً من دون تأكيد فعلي.
 * - الحالة لا تتغير إلا بدليل: لا يُكتب «منجز» قبل تحقق معيار القبول.
 *
 * التحديث يتم بتعديل هذا الملف ونشره. لا تخزين في قاعدة البيانات عمداً: إضافة
 * جدول مهام تحتاج ترحيلاً على قاعدة الإنتاج، وهذا خارج نطاق هذه الصفحة.
 */

export type TaskPriority = "P0" | "P1" | "P2";
export type TaskStatus = "OPEN" | "IN_PROGRESS" | "BLOCKED" | "DONE";
export type DecisionStatus = "PENDING" | "APPROVED" | "REJECTED";

export type TaskOwner = { name: string; confirmed: boolean };

export type TaskGap = {
  id: string;
  priority: TaskPriority;
  problem: string;
  action: string;
  owners: TaskOwner[];
  /** ISO date (YYYY-MM-DD) أو null للبنود المؤجلة بلا موعد. */
  due: string | null;
  dueNote?: string;
  acceptance: string;
  status: TaskStatus;
};

export type TaskPhase = {
  id: string;
  label: string;
  start: string;
  end: string;
  deliverables: string[];
  owners: TaskOwner[];
};

export type TaskDecision = {
  id: string;
  decision: string;
  why: string;
  status: DecisionStatus;
};

export type TaskTest = { id: string; name: string; method: string; accepted: string; passed: boolean };

const proposed = (...names: string[]): TaskOwner[] => names.map((name) => ({ name, confirmed: false }));

export const LOGESTECHS_TASK = {
  title: "تكامل LogesTechs مع qbl.sa — استقرار التشغيل أولًا",
  priority: "P0" as TaskPriority,
  goal: "تحقيق تدفق شحنة موثوق من qbl.sa إلى LogesTechs والعودة، مع تطابق الحالة، إدارة الاستثناءات، إثبات التسليم، والتسوية المالية قبل التوسع.",
  windowStart: "2026-10-12",
  windowEnd: "2026-11-10",
  updatedAt: "2026-10-12",
  reference: "LOGESTECHS_QBL_TASK.md",
  dailyReview: {
    time: "10:00 صباحًا بتوقيت الرياض",
    questions: [
      "ما حالة بنود P0 المفتوحة؟",
      "ما العوائق؟",
      "من المالك وهل أكد؟",
      "ما الموعد التالي؟",
      "ما الخطوة التالية اليوم؟",
    ],
  },
} as const;

export const TASK_GAPS: TaskGap[] = [
  {
    id: "G01",
    priority: "P0",
    problem: "لم يصدر أي حدث من LogesTechs إلى qbl خلال 30 يومًا: رابط qbl غير مفعّل وجهةً لديهم",
    action: "متابعة طلب إضافة رابط qbl وجهةً إضافية بترويسة X-API-Key مع حدث تجريبي واحد (أُرسل الطلب 11 أكتوبر). نموذج الويبهوك لديهم يدعم الترويسات المخصصة",
    owners: proposed("عبدالله", "LogesTechs"),
    due: "2026-10-13",
    acceptance: "حدث تجريبي واحد يعيد 200 ويظهر صف في صندوق الوارد وسجل التدقيق",
    status: "IN_PROGRESS",
  },
  {
    id: "G02",
    priority: "P0",
    problem: "الشحنات الحقيقية غير موجودة في QBL",
    action: "عند حدث لباركود غير معروف: إنشاء سجل شحنة ظل بدل التجاهل",
    owners: proposed("المالك التقني"),
    due: "2026-10-18",
    acceptance: "حدث لشحنة جديدة ينشئ سجلًا واحدًا، وتكراره لا ينشئ ثانيًا",
    status: "OPEN",
  },
  {
    id: "G03",
    priority: "P0",
    problem: "ضياع أحداث عند تعذر الاستقبال",
    action: "نُشر صندوق الوارد (PR #18): يحفظ كل حدث قبل المعالجة ويعيد 200، وأُزيل حد المعدل في الذاكرة من مسار المورد. المتبقي: إثبات المعيار على الإنتاج بعد تفعيل الوجهة",
    owners: proposed("المالك التقني"),
    due: "2026-10-18",
    acceptance: "صفر أحداث مفقودة في اختبار 50 حدثًا متتاليًا",
    status: "IN_PROGRESS",
  },
  {
    id: "G04",
    priority: "P0",
    problem: "لا مزامنة احتياطية غير الويبهوك",
    action: "تسوية دورية كل 15 دقيقة للشحنات المفتوحة عبر قراءة الحالة",
    owners: proposed("المالك التقني"),
    due: "2026-10-18",
    acceptance: "فرق الحالة بين النظامين صفر بعد دورة واحدة",
    status: "OPEN",
  },
  {
    id: "G19",
    priority: "P0",
    problem: "المهام المجدولة الثلاث معطّلة: سر التشغيل CRON_SECRET غير مضبوط في الإنتاج",
    action: "ضُبط السر في متغيرات الإنتاج (12 أكتوبر) وأُعيد النشر من المصدر. تشغيل الاستطلاع 16:45 و17:00 والمراقبة 17:00 اجتازت التحقق، والمراقبة اتصلت بالقاعدة. المتبقي: التحقق المباشر من أول تشغيل للتقرير اليومي عند 01:00 بتوقيت UTC أو استدعاء مساره في الإنتاج وتوثيق السجل",
    owners: proposed("المالك التقني"),
    due: "2026-10-14",
    acceptance: "الوظائف الثلاث لا تعيد خطأ غياب السر في سجلات الاستضافة",
    status: "IN_PROGRESS",
  },
  {
    id: "G20",
    priority: "P0",
    problem: "حسابات افتراضية كلماتها منشورة في المستودع العام كانت فعّالة في الإنتاج",
    action: "حارس يرفض كلمات البيانات التجريبية في الإنتاج (PR #19) وإيقاف الحسابات الأحد عشر في القاعدة",
    owners: proposed("عبدالله"),
    due: "2026-10-12",
    acceptance: "الحسابات الأحد عشر موقوفة، والدخول بكلماتها مرفوض في الإنتاج",
    status: "DONE",
  },
  {
    id: "G05",
    priority: "P0",
    problem: "خريطة الحالات ناقصة (14 من 25 حالة غير مربوطة)",
    action: "خريطة موحدة للحالات الـ 25 مع فصل الحالة عن سبب الفشل",
    owners: proposed("سلمان", "المالك التقني"),
    due: "2026-10-16",
    acceptance: "كل حالات التوثيق لها مقابل موثق، و«لا يرد» لا تُعامل كإلغاء",
    status: "OPEN",
  },
  {
    id: "G06",
    priority: "P0",
    problem: "سبب الفشل يضيع",
    action: "حفظ ملاحظات المورد كسبب فشل وتصنيفه (لا يرد، رفض، مغلق، غير موجود)",
    owners: proposed("المالك التقني"),
    due: "2026-10-16",
    acceptance: "كل أحداث الفشل تحمل سببًا مصنفًا",
    status: "OPEN",
  },
  {
    id: "G07",
    priority: "P0",
    problem: "ترتيب الأحداث والطوابع الزمنية خاطئان",
    action: "الاعتماد على زمن الحدث ورفض ما هو أقدم من آخر حدث مطبَّق",
    owners: proposed("المالك التقني"),
    due: "2026-10-18",
    acceptance: "اختبار أحداث معكوسة الترتيب ينتج الحالة الصحيحة",
    status: "OPEN",
  },
  {
    id: "G08",
    priority: "P0",
    problem: "إثبات التسليم غير محفوظ",
    action: "حفظ روابط إثبات التسليم وزمن الحدث مع حالة التسليم",
    owners: proposed("المالك التقني"),
    due: "2026-10-25",
    acceptance: "كل تسليم من المورد يحمل إثباتًا أو يظهر استثناءً",
    status: "OPEN",
  },
  {
    id: "G09",
    priority: "P0",
    problem: "لا مركز استثناءات",
    action: "قائمة استثناءات: عالقة، متأخرة، فشل، بلا إثبات، فروقات حالة — بشرائح عمر",
    owners: proposed("سلمان"),
    due: "2026-10-25",
    acceptance: "كل استثناء له مالك وعمر وإجراء",
    status: "OPEN",
  },
  {
    id: "G10",
    priority: "P0",
    problem: "الإسناد والاستلام غير مرئيين",
    action: "حساب تأخر الإسناد والخروج مقابل مدة الخدمة المتفق عليها",
    owners: proposed("سلمان"),
    due: "2026-10-25",
    acceptance: "لوحة تُظهر التأخر بشرائح عمر",
    status: "OPEN",
  },
  {
    id: "G11",
    priority: "P1",
    problem: "رمز التحقق لا يصل العميل",
    action: "قرار: التسليم عبر تطبيق LogesTechs أم تطبيق QBL، ثم ربط مزود رسائل حقيقي أو تعطيل المسار",
    owners: proposed("محمد"),
    due: "2026-10-25",
    acceptance: "قرار موثق، وإن فُعّل: الرمز يصل فعليًا في اختبار",
    status: "OPEN",
  },
  {
    id: "G12",
    priority: "P1",
    problem: "الإلغاء والمحاولة والمرتجع مختلطة",
    action: "فصل المسارات وإضافة عداد محاولات",
    owners: proposed("المالك التقني"),
    due: "2026-10-25",
    acceptance: "مرتجع بعد تسليم يُسجَّل دون كسر",
    status: "OPEN",
  },
  {
    id: "G13",
    priority: "P1",
    problem: "أرقام التحصيل عند الاستلام مضلِّلة",
    action: "فلتر تاريخ بتوقيت الرياض، ضبط العهدة عند التسليم، حفظ قيمة التحصيل من الويبهوك",
    owners: proposed("المحاسبة", "المالك التقني"),
    due: "2026-11-01",
    acceptance: "فرق التحصيل بين LogesTechs وQBL صفر لعينة أسبوع",
    status: "OPEN",
  },
  {
    id: "G14",
    priority: "P1",
    problem: "لا فواتير داخل النظام",
    action: "تحديد مصدر الفواتير ثم المطابقة",
    owners: proposed("المحاسبة"),
    due: "2026-11-01",
    acceptance: "تسوية أسبوعية موقّعة",
    status: "OPEN",
  },
  {
    id: "G15",
    priority: "P1",
    problem: "تغطية الحرارة غير مثبتة",
    action: "تسجيل الحساسات، تصدير السجل، إقفال يدوي للتنبيه، تقرير بتوقيت الرياض يُرسل فعلًا",
    owners: proposed("سلمان", "المالك التقني"),
    due: "2026-11-01",
    acceptance: "تغطية بنسبة متفق عليها وسجل قابل للتصدير، وإلا تبقى «غير معروفة»",
    status: "OPEN",
  },
  {
    id: "G16",
    priority: "P1",
    problem: "ربط Omniful جاهز من جهتها وينتظر إنشاء حساب QBL في لوحتها",
    action: "التاجر ينشئ حساب QBL في لوحة Omniful، ثم يُسلَّم رابط الويبهوك إلى LogesTechs وجهةً مستقلة لا تستبدل رابط qbl ولا الوجهة القائمة. لا كود في qbl.sa",
    owners: proposed("التاجر", "عبدالله"),
    due: "2026-10-16",
    acceptance: "رابط ويبهوك Omniful مسجّل لدى LogesTechs، ووجهة qbl والوجهة القائمة كما هما",
    status: "BLOCKED",
  },
  {
    id: "G17",
    priority: "P2",
    problem: "إنشاء الشحنات من QBL",
    action: "إنشاء الشحنة لدى المورد بحساب مخصص",
    owners: proposed("المالك التقني"),
    due: null,
    dueNote: "بعد الاستقرار",
    acceptance: "يُحدَّد عند البدء",
    status: "OPEN",
  },
  {
    id: "G18",
    priority: "P2",
    problem: "التخزين والتجهيز وبوابة العميل",
    action: "بعد استقرار البيانات",
    owners: proposed("محمد"),
    due: null,
    dueNote: "بعد الاستقرار",
    acceptance: "يُحدَّد عند البدء",
    status: "OPEN",
  },
];

export const TASK_PHASES: TaskPhase[] = [
  {
    id: "PH1",
    label: "الأيام 1–2",
    start: "2026-10-12",
    end: "2026-10-13",
    deliverables: [
      "فحص الحساب الحي وسجلات الاستضافة",
      "تأكيد المصادقة مع LogesTechs",
      "خط الأساس للمؤشرات",
      "تأكيد المالكين",
    ],
    owners: proposed("محمد", "سلمان"),
  },
  {
    id: "PH2",
    label: "الأيام 3–7",
    start: "2026-10-14",
    end: "2026-10-18",
    deliverables: [
      "خريطة الحالات الـ 25 وفصل سبب الفشل",
      "صندوق وارد خام وسجل الظل",
      "ترتيب بزمن الحدث",
      "تسوية دورية",
      "اختبارات المسار وقاعدة البيانات",
    ],
    owners: proposed("المالك التقني"),
  },
  {
    id: "PH3",
    label: "الأيام 8–14",
    start: "2026-10-19",
    end: "2026-10-25",
    deliverables: [
      "مركز الاستثناءات",
      "تأخر الإسناد والخروج",
      "حفظ إثبات التسليم والموقع",
      "فصل الإلغاء والمحاولات والمرتجعات",
      "قرار رمز التحقق",
    ],
    owners: proposed("سلمان", "المالك التقني"),
  },
  {
    id: "PH4",
    label: "الأيام 15–21",
    start: "2026-10-26",
    end: "2026-11-01",
    deliverables: [
      "التحصيل والعهدة والتسويات",
      "مصدر الفواتير",
      "الحرارة: تسجيل، تصدير، إقفال",
      "اختبارات الفشل وإعادة المحاولة",
    ],
    owners: proposed("المحاسبة", "المالك التقني"),
  },
  {
    id: "PH5",
    label: "الأيام 22–30",
    start: "2026-11-02",
    end: "2026-11-10",
    deliverables: [
      "اختبار كامل من الطرف إلى الطرف على شحنات فعلية",
      "اختبار قبول المستخدم",
      "تشغيل تجريبي محدود",
      "خطة التراجع",
    ],
    owners: proposed("محمد", "سلمان", "LogesTechs"),
  },
];

export const TASK_DECISIONS: TaskDecision[] = [
  { id: "D1", decision: "إنشاء شحنة اختبار في LogesTechs", why: "يغيّر بيانات إنتاج المورد", status: "PENDING" },
  { id: "D2", decision: "إنشاء سجلات ظل للشحنات غير المعروفة", why: "يغيّر سلوك الإنتاج ويكتب في قاعدته", status: "PENDING" },
  { id: "D3", decision: "قبول طريقة مصادقة بديلة إن تعذرت الترويسة", why: "يمس الأمن. على الأرجح غير لازم: نموذج الويبهوك لدى المورد يقبل ترويسات مخصصة", status: "PENDING" },
  { id: "D4", decision: "توحيد رابط الويبهوك إلى qbl.sa", why: "تغيير إعداد لدى المورد", status: "PENDING" },
  { id: "D5", decision: "حفظ بيانات سائق المورد وصور إثبات التسليم", why: "بيانات شخصية وصور تحتاج سياسة احتفاظ", status: "PENDING" },
  { id: "D6", decision: "مصدر الحقيقة للتسليم: تطبيق LogesTechs أم تطبيق QBL", why: "يحدد مصير رمز التحقق وإثبات التسليم", status: "PENDING" },
  { id: "D7", decision: "ربط مزود رسائل نصية حقيقي", why: "تكلفة ورسائل لعملاء حقيقيين", status: "PENDING" },
  { id: "D8", decision: "مراسلة LogesTechs لإضافة وجهة qbl (أُرسلت 11 أكتوبر)، وإلغاء مسودة طلب الشحنات التجريبية من «أي مكان»", why: "تواصل خارجي", status: "APPROVED" },
  { id: "D9", decision: "لا يُطلب من أي عميل شحنات تجريبية قبل نجاح T1", why: "يحمي ثقة العميل", status: "PENDING" },
  { id: "D10", decision: "تنظيف البيانات التجريبية من قاعدة الإنتاج", why: "ثبت وجودها: 40 طلبًا تجريبيًا و3 محطات تظهر في لوحات الإدارة. الحذف يحتاج قرارًا", status: "PENDING" },
  { id: "D11", decision: "تثبيت المالكين", why: "كلهم غير مؤكدين", status: "PENDING" },
  {
    id: "D12",
    decision: "ربط Omniful يمضي فور إنشاء التاجر حساب QBL، دون إرسال إشعار تأجيل",
    why: "قرار المالك 12 أكتوبر: قد يبدأ الشحن هذا الأسبوع. يُعالَج خطر الخلط مع طلب qbl بذكر أن رابط Omniful وجهة مستقلة",
    status: "APPROVED",
  },
];

export const TASK_TESTS: TaskTest[] = [
  { id: "T1", name: "وصول حدث تجريبي", method: "LogesTechs تغيّر حالة شحنة اختبار", accepted: "200 وصف في سجل التدقيق", passed: false },
  { id: "T2", name: "رفض بلا مفتاح", method: "طلب بلا ترويسة المصادقة", accepted: "401 ويُسجَّل الرفض", passed: false },
  { id: "T3", name: "تكرار الحدث", method: "إرسال الحدث نفسه مرتين", accepted: "سجل واحد والثاني مكرر", passed: false },
  { id: "T4", name: "ترتيب معكوس", method: "فشل أقدم يصل بعد خروج للتوصيل أحدث", accepted: "تبقى الحالة «خرج للتوصيل»", passed: false },
  { id: "T5", name: "شحنة غير معروفة", method: "حدث لباركود جديد", accepted: "إنشاء سجل ظل واحد", passed: false },
  { id: "T6", name: "سبب فشل", method: "فشل مع ملاحظة «لا يرد»", accepted: "سبب مصنّف والحالة ليست إلغاء", passed: false },
  { id: "T7", name: "إثبات التسليم", method: "تسليم مع مرفقات", accepted: "الإثبات محفوظ ومرتبط", passed: false },
  { id: "T8", name: "ضغط", method: "50 حدثًا خلال دقيقة", accepted: "صفر مفقود", passed: false },
  { id: "T9", name: "تسوية", method: "تعطيل الويبهوك ثم تشغيل التسوية الدورية", accepted: "تتطابق الحالات بعد دورة", passed: false },
  { id: "T10", name: "التحصيل", method: "عينة أسبوع", accepted: "فرق صفر أو مفسَّر", passed: false },
  { id: "T11", name: "التراجع", method: "تعطيل المعالج بمتغير بيئة", accepted: "يعود السلوك السابق دون فقد الصندوق الوارد", passed: false },
];

const DAY_MS = 86_400_000;

/** منتصف الليل UTC لتاريخ ISO — المقارنات كلها بالأيام، فلا أثر للمنطقة الزمنية. */
function isoDay(value: string): number {
  return Date.parse(`${value}T00:00:00Z`);
}

/** تاريخ اليوم (YYYY-MM-DD) بتوقيت الرياض، مستقلاً عن منطقة الخادم. */
export function riyadhToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(now);
}

export type WindowProgress = { day: number; total: number; state: "BEFORE" | "RUNNING" | "ENDED" };

export function windowProgress(today: string): WindowProgress {
  const start = isoDay(LOGESTECHS_TASK.windowStart);
  const end = isoDay(LOGESTECHS_TASK.windowEnd);
  const total = Math.round((end - start) / DAY_MS) + 1;
  const current = isoDay(today);
  if (current < start) return { day: 0, total, state: "BEFORE" };
  if (current > end) return { day: total, total, state: "ENDED" };
  return { day: Math.round((current - start) / DAY_MS) + 1, total, state: "RUNNING" };
}

/** متأخر = له موعد مضى ولم يُنجز. البنود بلا موعد لا تتأخر. */
export function isOverdue(gap: TaskGap, today: string): boolean {
  return gap.due !== null && gap.status !== "DONE" && isoDay(gap.due) < isoDay(today);
}

export function activePhase(today: string): TaskPhase | null {
  const current = isoDay(today);
  return TASK_PHASES.find((phase) => isoDay(phase.start) <= current && current <= isoDay(phase.end)) ?? null;
}

export function gapsByPriority(priority: TaskPriority): TaskGap[] {
  return TASK_GAPS.filter((gap) => gap.priority === priority);
}

export type TaskSummary = {
  p0Open: number;
  p0Total: number;
  overdue: number;
  pendingDecisions: number;
  unconfirmedOwners: number;
  testsPassed: number;
  testsTotal: number;
};

export function summarize(today: string): TaskSummary {
  const p0 = gapsByPriority("P0");
  const ownerNames = new Set<string>();
  for (const gap of TASK_GAPS) {
    for (const owner of gap.owners) if (!owner.confirmed) ownerNames.add(owner.name);
  }
  return {
    p0Open: p0.filter((gap) => gap.status !== "DONE").length,
    p0Total: p0.length,
    overdue: TASK_GAPS.filter((gap) => isOverdue(gap, today)).length,
    pendingDecisions: TASK_DECISIONS.filter((decision) => decision.status === "PENDING").length,
    unconfirmedOwners: ownerNames.size,
    testsPassed: TASK_TESTS.filter((test) => test.passed).length,
    testsTotal: TASK_TESTS.length,
  };
}
