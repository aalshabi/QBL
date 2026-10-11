import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** /t — short shortcut that redirects to the canonical employee entry /team. */
export default function TeamShortcutPage() {
  redirect("/team");
}
