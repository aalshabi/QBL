"use client";

import { useActionState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { submitLead, type LeadResult } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const INITIAL: LeadResult = { ok: false };

async function action(_prev: LeadResult, formData: FormData): Promise<LeadResult> {
  return submitLead(formData);
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
      <div className="grid gap-2">
        <Label htmlFor="message">ما الذي تحتاجه شركتك؟</Label>
        <Textarea
          id="message"
          name="message"
          rows={6}
          placeholder="مثال: 80 طلب يوميًا، منتجات طازجة 0 إلى +5، تغطية شمال وشرق الرياض، نحتاج تتبع للعميل وكود استلام."
          required
        />
      </div>
      {state.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button disabled={pending} className="bg-accent text-accent-foreground hover:bg-accent/90">
        <Send className="h-4 w-4" />
        اطلب دراسة تشغيل وسعر
      </Button>
    </form>
  );
}
