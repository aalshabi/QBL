"use client";

import { useActionState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { submitLead, type LeadResult } from "@/lib/actions";
import {
  COVERAGE_AREA_OPTIONS,
  DAILY_VOLUME_OPTIONS,
  PLATFORM_OPTIONS,
  type ChoiceOption,
} from "@/lib/lead-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const INITIAL: LeadResult = { ok: false };

async function action(_prev: LeadResult, formData: FormData): Promise<LeadResult> {
  return submitLead(formData);
}

/**
 * حقل تأهيل اختياري. قائمة واحدة لا اختيار متعدد عن قصد: الإجراء الخادمي يقرأ
 * `Object.fromEntries(formData)`، وهي تُبقي آخر قيمة فقط لمفتاح مكرر — فمجموعة
 * خانات اختيار كانت ستفقد كل ما عدا الأخير بصمت.
 *
 * `name` هنا يجب أن يطابق مفتاح lib/lead-schema.ts حرفياً، وإلا سقط الحقل صامتاً.
 */
function ChoiceField({
  id,
  label,
  options,
}: {
  id: string;
  label: string;
  options: readonly ChoiceOption[];
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>
        {label} <span className="font-normal text-muted-foreground">(اختياري)</span>
      </Label>
      <select
        id={id}
        name={id}
        defaultValue=""
        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">اختر…</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function QuoteForm() {
  const [state, formAction, pending] = useActionState(action, INITIAL);

  if (state.ok) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-accent/30 bg-frost-50 p-5">
        <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-accent" />
        <div>
          <p className="font-bold text-primary">تم استلام طلبك</p>
          <p className="mt-1 text-sm leading-6 text-slatebrand">
            وصلنا طلب دراسة التشغيل، وسيتواصل فريقنا معك قريباً على البيانات التي أدخلتها.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="name">اسم المسؤول</Label>
        <Input id="name" name="name" placeholder="مثال: مدير العمليات أو المشتريات" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="company">اسم الشركة</Label>
        <Input id="company" name="company" placeholder="اسم الشركة أو العلامة التجارية" required />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="email">البريد الرسمي</Label>
          <Input id="email" name="email" type="email" placeholder="name@company.com" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">رقم التواصل</Label>
          <Input id="phone" name="phone" placeholder="05xxxxxxxx" required />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <ChoiceField id="dailyVolume" label="حجم الطلبات المتوقع" options={DAILY_VOLUME_OPTIONS} />
        <ChoiceField id="platform" label="منصة متجرك" options={PLATFORM_OPTIONS} />
      </div>
      <ChoiceField id="coverageArea" label="نطاق التغطية المطلوب" options={COVERAGE_AREA_OPTIONS} />
      <div className="grid gap-2">
        <Label htmlFor="message">
          ما الذي تحتاجه شركتك؟ <span className="font-normal text-muted-foreground">(اختياري)</span>
        </Label>
        <Textarea
          id="message"
          name="message"
          rows={6}
          placeholder="مثال: 80 طلب يوميًا، منتجات تجميل وعناية تتأثر بحرارة النقل، تغطية شمال وشرق الرياض، نحتاج تتبع للعميل وكود استلام."
        />
      </div>
      {state.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button disabled={pending} className="bg-accent text-accent-foreground hover:bg-accent/90">
        <Send className="h-4 w-4" />
        أرسل طلب عرض السعر
      </Button>
    </form>
  );
}
