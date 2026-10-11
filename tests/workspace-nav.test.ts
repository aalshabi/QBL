import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { WORKSPACE_GROUPS, groupsForRole } from "@/lib/workspace-nav";

const root = fileURLToPath(new URL("../", import.meta.url));

/**
 * توحيد مساحة الموظفين في ست مجموعات تنظيمية. الثوابت المحمية هنا:
 * المجموعات ست بالضبط، لا مجموعة فارغة، وكل عنصر يشير إلى صفحة موجودة فعلاً —
 * المجموعات إعادة تنظيم لأدوات قائمة لا وحدات جديدة فارغة.
 */

test("المجموعات ست بالضبط وبالمعرّفات المتوقعة", () => {
  assert.equal(WORKSPACE_GROUPS.length, 6);
  assert.deepEqual(
    WORKSPACE_GROUPS.map((group) => group.id),
    ["dashboard", "operations", "sales", "finance", "reports", "settings"],
  );
});

test("لا مجموعة فارغة — كل مجموعة تحمل عنصراً واحداً على الأقل", () => {
  for (const group of WORKSPACE_GROUPS) {
    assert.ok(group.items.length > 0, `المجموعة ${group.id} فارغة`);
    assert.ok(group.label.trim().length > 0, `المجموعة ${group.id} بلا عنوان`);
  }
});

test("كل عنصر تنقل يشير إلى صفحة موجودة فعلاً — لا وحدات وهمية", () => {
  const hrefs = WORKSPACE_GROUPS.flatMap((group) => group.items.map((item) => item.href));
  for (const href of hrefs) {
    // /admin => app/(admin)/admin/page.tsx ، /admin/orders => .../orders/page.tsx ، /ops => app/(ops)/ops/page.tsx
    const segment = href.replace(/^\//, "");
    const candidates =
      segment === "ops"
        ? ["app/(ops)/ops/page.tsx"]
        : [`app/(admin)/${segment}/page.tsx`];
    const found = candidates.some((rel) => {
      try {
        return statSync(join(root, rel)).isFile();
      } catch {
        return false;
      }
    });
    assert.ok(found, `لا صفحة تقابل ${href} (${candidates.join(" أو ")})`);
  }
});

test("لا رابط مكرر بين المجموعات — كل أداة في مجموعة واحدة", () => {
  const hrefs = WORKSPACE_GROUPS.flatMap((group) => group.items.map((item) => item.href));
  assert.equal(new Set(hrefs).size, hrefs.length, "يوجد رابط مكرر بين المجموعات");
});

test("كل مسارات /admin الموجودة ممثّلة في المجموعات — لا أداة ضائعة", () => {
  const adminDir = join(root, "app/(admin)");
  const present = new Set<string>();
  // اجمع كل /admin/* التي لها page.tsx
  const adminRoot = join(adminDir, "admin");
  const walk = (dir: string, prefix: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (!statSync(full).isDirectory()) continue;
      const href = `${prefix}/${entry}`;
      try {
        if (statSync(join(full, "page.tsx")).isFile()) present.add(href);
      } catch {
        /* لا صفحة مباشرة */
      }
      walk(full, href);
    }
  };
  if (statSync(join(adminRoot, "page.tsx")).isFile()) present.add("/admin");
  walk(adminRoot, "/admin");

  const mapped = new Set(WORKSPACE_GROUPS.flatMap((group) => group.items.map((item) => item.href)));
  for (const href of present) {
    assert.ok(mapped.has(href), `المسار ${href} موجود لكنه غير ممثّل في أي مجموعة`);
  }
});

test("groupsForRole يعكس وصول الخادم ولا يُظهر مجموعة فارغة", () => {
  for (const role of ["ADMIN", "OPS_MANAGER"] as const) {
    const groups = groupsForRole(role);
    assert.equal(groups.length, 6, `${role} يجب أن يرى المجموعات الست`);
    for (const group of groups) assert.ok(group.items.length > 0);
  }
  // الأدوار التي لا يسمح لها حارس /admin بالدخول لا ترى أي مجموعة هنا.
  assert.deepEqual(groupsForRole("DISPATCHER"), []);
  assert.deepEqual(groupsForRole("COURIER"), []);
  assert.deepEqual(groupsForRole("CLIENT"), []);
});

test("جميع ملفات مساحة العمل مُستوردة فعلاً في الواجهة", () => {
  const shell = readFileSync(join(root, "components/admin/admin-shell.tsx"), "utf8");
  assert.match(shell, /groupsForRole/, "الواجهة لا تستدعي groupsForRole");
  assert.match(shell, /roleLabel/, "الواجهة لا تعرض اسم الدور");
});
