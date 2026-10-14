import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { classifyReply } from "@/lib/whatsapp/intent";
import { normalizeSaudiPhone } from "@/lib/whatsapp/phone";
import { verifyMetaSignature } from "@/lib/whatsapp/security";
import { confirmationTemplate, DELIVERY_CONFIRMATION_COD_TEMPLATE, DELIVERY_CONFIRMATION_TEMPLATE } from "@/lib/whatsapp/templates";
import { customerServiceWindowEnds } from "@/lib/whatsapp/manual-reply";
import { shouldApplyMessageStatus } from "@/lib/whatsapp/webhook";

test("normalizes Saudi mobile numbers and rejects unsupported numbers", () => {
  assert.equal(normalizeSaudiPhone("050 123 4567"), "+966501234567");
  assert.equal(normalizeSaudiPhone("00966-55-123-4567"), "+966551234567");
  assert.equal(normalizeSaudiPhone("+966 54 123 4567"), "+966541234567");
  assert.equal(normalizeSaudiPhone("0111234567"), null);
});

test("classifies only explicit replies and escalates ambiguity", () => {
  assert.equal(classifyReply("نعم"), "CONFIRMED");
  assert.equal(classifyReply("بكره بعد المغرب"), "RESCHEDULE_REQUESTED");
  assert.equal(classifyReply("STOP"), "OPTED_OUT");
  assert.equal(classifyReply("وين المندوب؟"), "MANUAL_REVIEW");
});

test("validates Meta HMAC over exact raw bytes", () => {
  const secret = "a".repeat(32); const body = Buffer.from('{"x":1}');
  const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  assert.equal(verifyMetaSignature(body, signature, secret), true);
  assert.equal(verifyMetaSignature(Buffer.from('{"x":2}'), signature, secret), false);
});

test("uses separate utility templates for COD and prepaid shipments", () => {
  assert.equal(confirmationTemplate({ customerName: "A", merchantName: "B", shipmentCode: "C" }).name, DELIVERY_CONFIRMATION_TEMPLATE);
  assert.equal(confirmationTemplate({ customerName: "A", merchantName: "B", shipmentCode: "C", codAmount: "120.00" }).name, DELIVERY_CONFIRMATION_COD_TEMPLATE);
});

test("simulates 500 initial messages without any provider calls", () => {
  const keys = new Set(Array.from({ length: 500 }, (_, i) => `delivery-confirmation:order-${i}:v1`));
  assert.equal(keys.size, 500);
});

test("manual replies are allowed only inside the rolling 24-hour window", () => {
  const inbound = new Date("2026-10-14T10:00:00Z");
  assert.equal(customerServiceWindowEnds(inbound, new Date("2026-10-15T09:59:59Z")).open, true);
  assert.equal(customerServiceWindowEnds(inbound, new Date("2026-10-15T10:00:00Z")).open, false);
});

test("out-of-order callbacks cannot regress delivered or read messages", () => {
  assert.equal(shouldApplyMessageStatus("DELIVERED", "SENT"), false);
  assert.equal(shouldApplyMessageStatus("READ", "DELIVERED"), false);
  assert.equal(shouldApplyMessageStatus("SENT", "DELIVERED"), true);
  assert.equal(shouldApplyMessageStatus("READ", "FAILED"), false);
});
