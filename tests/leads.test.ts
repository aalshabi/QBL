import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  LeadStorageUnavailableError,
  devLeadCount,
  listLeads,
  resetDevLeads,
  saveLead,
} from "@/lib/leads";
import { leadAlertConfigured, leadAlertRecipient, notifyNewLead } from "@/lib/notifications/lead-alert";

const originalDatabaseUrl = process.env.DATABASE_URL;
const originalNodeEnv = process.env.NODE_ENV;
const originalProvider = process.env.LEAD_ALERT_PROVIDER;
const originalKey = process.env.RESEND_API_KEY;
const originalTo = process.env.LEAD_ALERT_EMAIL;

function restore(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

afterEach(() => {
  restore("DATABASE_URL", originalDatabaseUrl);
  restore("NODE_ENV", originalNodeEnv);
  restore("LEAD_ALERT_PROVIDER", originalProvider);
  restore("RESEND_API_KEY", originalKey);
  restore("LEAD_ALERT_EMAIL", originalTo);
  resetDevLeads();
});

const lead = {
  name: "عبدالله",
  company: "متجر عناية",
  email: "buyer@example.com",
  phone: "0555555555",
  message: "نحتاج توصيل مبرّد يومي داخل الرياض",
};

test("الإنتاج بلا DATABASE_URL يفشل بصوت عالٍ ولا يبتلع الطلب", async () => {
  delete process.env.DATABASE_URL;
  process.env.NODE_ENV = "production";

  await assert.rejects(() => saveLead(lead), LeadStorageUnavailableError);
  await assert.rejects(() => listLeads(), LeadStorageUnavailableError);
  assert.equal(devLeadCount(), 0);
});

test("التطوير بلا قاعدة بيانات يحفظ في مخزن الذاكرة ويقرأ منه", async () => {
  delete process.env.DATABASE_URL;
  process.env.NODE_ENV = "development";

  const saved = await saveLead(lead);
  assert.equal(saved.status, "NEW");
  assert.equal(saved.company, lead.company);

  const rows = await listLeads();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].email, lead.email);
});

test("بلا مزوّد مهيّأ لا يُدّعى الإرسال إطلاقاً", async () => {
  delete process.env.LEAD_ALERT_PROVIDER;
  delete process.env.RESEND_API_KEY;

  assert.equal(leadAlertConfigured(), false);
  const result = await notifyNewLead(lead, async () => {
    throw new Error("يجب ألا يُستدعى أي نداء شبكة بلا تهيئة");
  });
  assert.deepEqual(result, { status: "SKIPPED", reason: "NOT_CONFIGURED" });
});

test("وجهة التنبيه تتبع متغيّر البيئة وإلا بريد المبيعات الرسمي", () => {
  delete process.env.LEAD_ALERT_EMAIL;
  assert.equal(leadAlertRecipient(), "sales@qbl.sa");

  process.env.LEAD_ALERT_EMAIL = "owner@qbl.sa";
  assert.equal(leadAlertRecipient(), "owner@qbl.sa");
});

test("مع مزوّد مهيّأ يُرسل التنبيه ويُبلغ عن الفشل بصدق", async () => {
  process.env.LEAD_ALERT_PROVIDER = "resend";
  process.env.RESEND_API_KEY = "test-key-123456";
  process.env.LEAD_ALERT_EMAIL = "sales@qbl.sa";

  let seenUrl = "";
  let seenBody: Record<string, unknown> = {};
  const ok = await notifyNewLead(lead, async (url, init) => {
    seenUrl = String(url);
    seenBody = JSON.parse(String((init as RequestInit).body));
    return new Response("{}", { status: 200 });
  });

  assert.deepEqual(ok, { status: "SENT", provider: "resend", to: "sales@qbl.sa" });
  assert.equal(seenUrl, "https://api.resend.com/emails");
  assert.deepEqual(seenBody.to, ["sales@qbl.sa"]);
  assert.equal(seenBody.reply_to, lead.email);
  assert.ok(String(seenBody.text).includes(lead.phone));

  const failed = await notifyNewLead(lead, async () => new Response("nope", { status: 401 }));
  assert.equal(failed.status, "FAILED");
  assert.equal(failed.status === "FAILED" ? failed.reason : "", "HTTP 401");

  const threw = await notifyNewLead(lead, async () => {
    throw new Error("network down");
  });
  assert.equal(threw.status, "FAILED");
});
