import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { employeeHome } from "@/lib/workspace";

export const metadata: Metadata = {
  title: "دخول الفريق",
  // Internal entry — never indexed. robots.ts also disallows it; this is the
  // page-level belt to the robots.ts suspenders.
  robots: { index: false, follow: false },
};

/**
 * Canonical employee workspace entry (/team).
 * - Unauthenticated → the employee login screen.
 * - Authenticated → the destination permitted for the role.
 *
 * This is a routing entry only. Real authorization stays on each workspace's
 * own server guards (admin/ops/courier); reaching /team grants nothing.
 */
export default async function TeamEntryPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  redirect(employeeHome(session.role));
}
