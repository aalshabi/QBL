/**
 * إنشاء حساب موظف واحد في قاعدة البيانات — بلا حذف وبلا مساس بأي حساب آخر.
 *
 * الاستخدام (كلمة المرور من متغير بيئة فقط، لا تُكتب في الأمر ولا في ملف):
 *
 *   NEW_USER_PASSWORD='…' npx tsx scripts/create-user.ts \
 *     --email someone@qbl.sa --name "الاسم" --role OPS_MANAGER
 *
 * المتطلبات:
 * - DATABASE_URL يشير إلى القاعدة المقصودة (لا قيمة افتراضية هنا عمداً).
 * - OTP_PEPPER مطابق لقيمة بيئة التشغيل؛ بدونه يُحسب الهاش بقيمة مختلفة
 *   ولن ينجح الدخول، لذلك يرفض السكربت العمل عند غيابه.
 *
 * الأدوار المسموحة هنا أدوار الموظفين غير الميدانيين فقط. حساب موجود لا
 * يُعدَّل إلا مع --reset-password صراحةً، وعندها تتغير كلمة المرور فقط.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { hashOtp } from "../lib/security";

const ALLOWED_ROLES = ["ADMIN", "OPS_MANAGER", "DISPATCHER"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

const MIN_PASSWORD_LENGTH = 10;
/** كلمات المرور الافتراضية في prisma/seed.ts منشورة في المستودع — تُرفض دائماً. */
const PUBLISHED_DEFAULTS = new Set(["Admin123456", "Courier123456"]);

export type CreateUserInput = { email: string; name: string; role: string; password: string };

/** يعيد قائمة الأخطاء؛ فارغة = المدخلات صالحة. بلا أي أثر جانبي. */
export function validateInput(input: CreateUserInput): string[] {
  const errors: string[] = [];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) errors.push("البريد غير صالح");
  if (input.name.trim().length < 2) errors.push("الاسم مطلوب");
  if (!(ALLOWED_ROLES as readonly string[]).includes(input.role)) {
    errors.push(`الدور غير مسموح. المسموح: ${ALLOWED_ROLES.join(", ")}`);
  }
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`كلمة المرور أقصر من ${MIN_PASSWORD_LENGTH} خانات`);
  }
  if (PUBLISHED_DEFAULTS.has(input.password)) errors.push("كلمة المرور من القيم الافتراضية المنشورة");
  const localPart = input.email.split("@")[0].toLowerCase();
  // الأسماء القصيرة جداً ترد في أي كلمة مرور صدفةً، فلا تُفحص.
  if (localPart.length >= 4 && input.password.toLowerCase().includes(localPart)) {
    errors.push("كلمة المرور تحتوي اسم الحساب");
  }
  return errors;
}

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function main() {
  const input: CreateUserInput = {
    email: (readArg("email") ?? "").trim().toLowerCase(),
    name: (readArg("name") ?? "").trim(),
    role: (readArg("role") ?? "OPS_MANAGER").trim(),
    password: process.env.NEW_USER_PASSWORD ?? "",
  };
  const resetPassword = process.argv.includes("--reset-password");

  const missing = ["DATABASE_URL", "OTP_PEPPER", "NEW_USER_PASSWORD"].filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`متغيرات بيئة ناقصة: ${missing.join(", ")}`);
    process.exit(1);
  }

  const errors = validateInput(input);
  if (errors.length > 0) {
    for (const error of errors) console.error(`✗ ${error}`);
    process.exit(1);
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    const passwordHash = await hashOtp(input.password);
    const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });

    if (existing && !resetPassword) {
      console.error("✗ الحساب موجود. لم يتغير شيء. لتغيير كلمة المرور فقط أضف --reset-password");
      process.exit(1);
    }

    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data: { passwordHash } });
      console.log(`✓ حُدّثت كلمة المرور للحساب ${input.email}. الأدوار لم تتغير.`);
      return;
    }

    const role = input.role as AllowedRole;
    const user = await prisma.$transaction(async (tx) => {
      const roleRow = await tx.role.upsert({ where: { name: role }, update: {}, create: { name: role } });
      return tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          roles: { create: [{ roleId: roleRow.id }] },
        },
        select: { id: true, email: true, status: true },
      });
    });
    console.log(`✓ أُنشئ الحساب ${user.email} بدور ${role} (${user.status}).`);
  } finally {
    await prisma.$disconnect();
  }
}

// يُشغَّل فقط عند الاستدعاء المباشر؛ الاستيراد في الاختبارات لا يلمس القاعدة.
if (process.argv[1]?.endsWith("create-user.ts")) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
