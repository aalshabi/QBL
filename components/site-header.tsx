"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, PhoneCall } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { marketingNav } from "@/lib/company";

export function SiteHeader() {
  const pathname = usePathname();
  const isEnglish = pathname === "/en" || pathname.startsWith("/en/");
  const nav = isEnglish
    ? [
        { href: "/en", label: "Home" },
        { href: "/en/beauty-shield", label: "Beauty Shield" },
        { href: "/en/trial", label: "Trial" },
      ]
    : marketingNav;

  return (
    <header className="sticky top-0 z-50 border-b bg-background/94 backdrop-blur no-print" dir={isEnglish ? "ltr" : "rtl"}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <BrandLogo href={isEnglish ? "/en" : "/"} />
        <nav className="hidden items-center gap-5 text-sm font-medium text-muted-foreground lg:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-primary">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Button asChild variant="outline" size="sm">
            <Link href="/contact">
              <PhoneCall className="h-4 w-4" />
              {isEnglish ? "Contact" : "تواصل"}
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href={isEnglish ? "/en/trial" : "/trial"}>{isEnglish ? "Start a trial" : "ابدأ التجربة"}</Link>
          </Button>
        </div>
        <Sheet>
          <SheetTrigger render={<Button variant="outline" size="icon" className="lg:hidden" aria-label="فتح القائمة" />}>
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <div className="mt-6 space-y-6">
              <BrandLogo href={isEnglish ? "/en" : "/"} />
              <nav className="grid gap-3 text-sm font-medium">
                {nav.map((item) => (
                  <Link key={item.href} href={item.href} className="rounded-md px-2 py-2 hover:bg-muted">
                    {item.label}
                  </Link>
                ))}
              </nav>
              <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href={isEnglish ? "/en/trial" : "/trial"}>{isEnglish ? "Start a trial" : "ابدأ التجربة"}</Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
