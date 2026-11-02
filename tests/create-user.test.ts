import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { validateInput } from "../scripts/create-user";

const source = readFileSync(fileURLToPath(new URL("../scripts/create-user.ts", import.meta.url)), "utf8");
const valid = { email: "team@example.test", name: "اختبار", role: "OPS_MANAGER", password: "Local-Test-Pass-91" };

test("مدخلات صالحة تمر بلا أخطاء", () => {
  assert.deepEqual(validateInput(valid), []);
});

test("يرفض كلمة المرور القصيرة والافتراضية المنشورة والمحتوية على اسم الحساب", () => {
  assert.equal(validateInput({ ...valid, password: "short" }).length, 1);
  assert.ok(validateInput({ ...valid, password: "Admin123456" }).length >= 1);
  assert.ok(validateInput({ ...valid, password: "Courier123456" }).length >= 1);
  assert.equal(validateInput({ ...valid, password: "Team-Pass-12345" }).length, 1);
  // اسم حساب قصير جداً لا يُفحص، حتى لا تُرفض كل كلمة مرور صدفةً.
  assert.deepEqual(validateInput({ ...valid, email: "t@example.test" }), []);
});

test("يرفض الأدوار خارج أدوار الموظفين غير الميدانيين والبريد غير الصالح", () => {
  for (const role of ["COURIER", "CLIENT", "ROOT", ""]) {
    assert.equal(validateInput({ ...valid, role }).length, 1, role);
  }
  assert.equal(validateInput({ ...valid, email: "not-an-email" }).length, 1);
});

test("السكربت لا يحذف ولا يقرأ كلمة المرور من سطر الأمر ولا يملك قاعدة افتراضية", () => {
  assert.doesNotMatch(source, /deleteMany|\.delete\(/, "السكربت يحذف بيانات");
  assert.doesNotMatch(source, /readArg\("password"\)/, "كلمة المرور تُقرأ من سطر الأمر");
  assert.doesNotMatch(source, /localhost/, "للسكربت قاعدة بيانات افتراضية");
  assert.match(source, /"OTP_PEPPER"/, "السكربت لا يشترط OTP_PEPPER");
});
