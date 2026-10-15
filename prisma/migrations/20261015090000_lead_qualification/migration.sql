-- حقول تأهيل العميل المحتمل من نموذج الموقع.
-- NOT NULL DEFAULT '' لا nullable: نفس عقد عمود message، فلا يحتاج أي قارئ
-- فحص null، والصفوف القائمة تأخذ '' دون إعادة كتابة يدوية.

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "coverageArea" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "dailyVolume" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "platform" TEXT NOT NULL DEFAULT '';
