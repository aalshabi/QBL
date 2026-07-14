"use client";

import { useActionState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { submitLead, type LeadResult } from "@/lib/actions";
import { SITE } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const INITIAL: LeadResult = { ok: false };

async function action(_prev: LeadResult, formData: FormData): Promise<LeadResult> {
  return submitLead(formData);
}

const fieldClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function Field({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-2">{children}</div>;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-4 rounded-lg border border-line bg-frost-50/60 p-5">
      <legend className="px-2 text-sm font-bold text-accent">{title}</legend>
      {children}
    </fieldset>
  );
}

export function TrialForm() {
  const [state, formAction, pending] = useActionState(action, INITIAL);

  if (state.ok) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-accent/30 bg-frost-50 p-6">
        <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-accent" />
        <div>
          <p className="text-lg font-bold text-primary">استلمنا طلبك.</p>
          <p className="mt-2 text-sm leading-7 text-slatebrand">
            سيتواصل معك فريق QBL خلال يوم عمل واحد لمراجعة منتجاتك وتحديد موعد جلسة تقييم قصيرة.
          </p>
          <p className="mt-3 text-sm leading-7 text-slatebrand">
            لأي استفسار عاجل:{" "}
            <a className="font-bold text-accent ltr" href={`mailto:${SITE.emails.info}`}>
              {SITE.emails.info}
            </a>{" "}
            أو{" "}
            <a className="font-bold text-accent ltr" href={`tel:${SITE.phone.replace(/\s/g, "")}`}>
              {SITE.phone}
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-5">
      <Group title="بيانات الشركة">
        <Field>
          <Label htmlFor="company">اسم الشركة *</Label>
          <Input id="company" name="company" placeholder="اسم العلامة أو الشركة" required />
        </Field>
        <Field>
          <Label htmlFor="website">الموقع الإلكتروني للعلامة</Label>
          <Input id="website" name="website" placeholder="https://" />
        </Field>
        <Field>
          <Label htmlFor="activityType">نوع النشاط *</Label>
          <select id="activityType" name="activityType" required defaultValue="" className={fieldClass}>
            <option value="" disabled>
              اختر النوع
            </option>
            <option>علامة تجارية</option>
            <option>موزع</option>
            <option>متجر إلكتروني</option>
            <option>D2C</option>
            <option>صيدليات</option>
            <option>عيادة</option>
            <option>صالون</option>
            <option>أخرى</option>
          </select>
        </Field>
      </Group>

      <Group title="بيانات التواصل">
        <Field>
          <Label htmlFor="name">اسم المسؤول *</Label>
          <Input id="name" name="name" placeholder="الاسم" required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <Label htmlFor="phone">رقم الجوال *</Label>
            <Input id="phone" name="phone" placeholder="05xxxxxxxx" required />
          </Field>
          <Field>
            <Label htmlFor="email">البريد الإلكتروني *</Label>
            <Input id="email" name="email" type="email" placeholder="name@company.com" required />
          </Field>
        </div>
      </Group>

      <Group title="بيانات المنتجات">
        <Field>
          <Label htmlFor="productTypes">أنواع المنتجات *</Label>
          <Input id="productTypes" name="productTypes" placeholder="مثال: سيروم فيتامين C، كريمات، مستحضرات عيادات" required />
        </Field>
        <Field>
          <Label htmlFor="storageInstructions">تعليمات الحفظ المكتوبة على المنتج *</Label>
          <Textarea
            id="storageInstructions"
            name="storageInstructions"
            rows={3}
            placeholder="مثال: يُحفظ بعيداً عن الحرارة والشمس / يُحفظ في درجة حرارة محددة"
            required
          />
        </Field>
        <Field>
          <Label htmlFor="needsRefrigeration">هل توجد منتجات تتطلب تبريداً فعلياً؟</Label>
          <select id="needsRefrigeration" name="needsRefrigeration" defaultValue="" className={fieldClass}>
            <option value="" disabled>
              اختر
            </option>
            <option>نعم</option>
            <option>لا</option>
            <option>غير متأكد</option>
          </select>
        </Field>
      </Group>

      <Group title="بيانات التشغيل">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <Label htmlFor="avgOrders">متوسط عدد الطلبات (يومي أو شهري) *</Label>
            <Input id="avgOrders" name="avgOrders" placeholder="مثال: 40 طلب يومياً" required />
          </Field>
          <Field>
            <Label htmlFor="pickupPoints">نقاط الاستلام داخل الرياض *</Label>
            <Input id="pickupPoints" name="pickupPoints" placeholder="عدد نقاط الاستلام ومواقعها" required />
          </Field>
        </div>
        <Field>
          <Label htmlFor="deliveryAreas">مناطق التسليم الرئيسية *</Label>
          <Input id="deliveryAreas" name="deliveryAreas" placeholder="مثال: شمال وشرق الرياض" required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <Label htmlFor="deliveryTime">مدة التوصيل المطلوبة</Label>
            <select id="deliveryTime" name="deliveryTime" defaultValue="" className={fieldClass}>
              <option value="" disabled>
                اختر
              </option>
              <option>قياسية 24–72 ساعة</option>
              <option>جدولة خاصة</option>
            </select>
          </Field>
          <Field>
            <Label htmlFor="docLevel">مستوى التوثيق المطلوب</Label>
            <select id="docLevel" name="docLevel" defaultValue="" className={fieldClass}>
              <option value="" disabled>
                اختر
              </option>
              <option>أساسي</option>
              <option>موسّع</option>
              <option>غير محدد بعد</option>
            </select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <Label htmlFor="hasReturns">هل توجد مرتجعات تحتاج شحناً عكسياً؟</Label>
            <select id="hasReturns" name="hasReturns" defaultValue="" className={fieldClass}>
              <option value="" disabled>
                اختر
              </option>
              <option>نعم</option>
              <option>لا</option>
            </select>
          </Field>
          <Field>
            <Label htmlFor="startDate">الموعد المفضل لبدء التجربة</Label>
            <Input id="startDate" name="startDate" placeholder="مثال: خلال أسبوعين" />
          </Field>
        </div>
      </Group>

      {state.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button disabled={pending} className="h-12 bg-accent text-accent-foreground hover:bg-accent/90">
        <Send className="h-4 w-4" />
        اطلب تقييم المنتج والمسار
      </Button>
    </form>
  );
}
