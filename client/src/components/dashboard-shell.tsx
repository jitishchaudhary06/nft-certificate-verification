"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Award,
  Building2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Search,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth, type UserRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navByRole: Record<UserRole, Array<{ href: string; label: string; icon: typeof Users }>> = {
  SUPER_ADMIN: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/universities", label: "Universities", icon: Building2 },
    { href: "/dashboard/students", label: "Students", icon: Users },
    { href: "/dashboard/certificates", label: "Certificates", icon: Award },
    { href: "/verify", label: "Verify", icon: Search },
  ],
  UNIVERSITY_ADMIN: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/students", label: "Students", icon: Users },
    { href: "/dashboard/certificates", label: "Certificates", icon: Award },
    { href: "/verify", label: "Verify", icon: Search },
  ],
  STUDENT: [
    { href: "/student", label: "My NFTs", icon: GraduationCap },
    { href: "/verify", label: "Verify", icon: Search },
  ],
  EMPLOYER: [
    { href: "/verify", label: "Verify", icon: Search },
  ],
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    router.replace("/login");
    return null;
  }

  const links = navByRole[user.role] || [];

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#ecfdf5_0%,_#f8fafc_45%,_#f1f5f9_100%)]">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 p-4 md:p-6">
        <aside className="hidden w-64 shrink-0 flex-col rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur md:flex">
          <Link href="/" className="mb-8 px-2">
            <p className="font-[family-name:var(--font-display)] text-xl font-semibold text-teal-800">
              CertChain
            </p>
            <p className="text-xs text-slate-500">NFT Certificates</p>
          </Link>
          <nav className="flex flex-1 flex-col gap-1">
            {links.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-teal-700 text-white" : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto space-y-3 border-t border-slate-100 pt-4">
            <div className="px-2">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.role.replace(/_/g, " ")}</p>
              {user.wallet && (
                <p className="mt-1 flex items-center gap-1 truncate text-xs text-teal-700">
                  <Wallet className="h-3 w-3" />
                  {user.wallet.address.slice(0, 10)}…
                </p>
              )}
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                await logout();
                router.push("/login");
              }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </aside>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
