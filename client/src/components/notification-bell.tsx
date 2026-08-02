"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function NotificationBell() {
  const { user } = useAuth();
  const enabled = user?.role === "SUPER_ADMIN" || user?.role === "UNIVERSITY_ADMIN";

  const { data } = useQuery({
    queryKey: ["pending-approvals-count"],
    queryFn: async () => (await api.get("/features/analytics")).data.data,
    enabled,
    refetchInterval: 60_000,
  });

  if (!enabled) return null;

  const pending = data?.pendingApprovals || 0;
  const expiring = data?.expiringSoon || 0;
  const total = pending + expiring;

  return (
    <Button asChild size="icon" variant="outline" className="relative" aria-label="Notifications">
      <Link href="/dashboard/certificates">
        <Bell className="h-4 w-4" />
        {total > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-700 px-1 text-[10px] font-semibold text-white">
            {total > 9 ? "9+" : total}
          </span>
        )}
      </Link>
    </Button>
  );
}
