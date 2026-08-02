"use client";

import { useQuery } from "@tanstack/react-query";
import { Award, Building2, Coins, GraduationCap, Users } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role === "STUDENT") router.replace("/student");
    if (!loading && user?.role === "EMPLOYER") router.replace("/verify");
  }, [user, loading, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get("/dashboard")).data.data,
    enabled: !!user && (user.role === "SUPER_ADMIN" || user.role === "UNIVERSITY_ADMIN"),
  });

  const stats = [
    { label: "Total Students", value: data?.totalStudents ?? 0, icon: Users },
    { label: "Total Certificates", value: data?.totalCertificates ?? 0, icon: Award },
    { label: "NFTs Minted", value: data?.nftsMinted ?? 0, icon: GraduationCap },
    { label: "Universities", value: data?.universities ?? 0, icon: Building2 },
    { label: "Wallet Balance", value: `${data?.walletBalance ?? "0"} MATIC`, icon: Coins },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Platform overview and recent activity</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">{stat.label}</CardTitle>
                  <Icon className="h-4 w-4 text-teal-700" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{isLoading ? "…" : stat.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data?.recentActivity || []).map((item: { id: string; action: string; createdAt: string; user?: { name: string } }) => (
                <div key={item.id} className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm">
                  <div>
                    <p className="font-medium">{item.action.replace(/_/g, " ")}</p>
                    <p className="text-slate-500">{item.user?.name || "System"}</p>
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(item.createdAt)}</span>
                </div>
              ))}
              {!data?.recentActivity?.length && (
                <p className="text-sm text-slate-500">No recent activity</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Certificates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data?.recentCertificates || []).map(
                (cert: {
                  id: string;
                  title: string;
                  status: string;
                  student: { firstName: string; lastName: string };
                }) => (
                  <div key={cert.id} className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm">
                    <div>
                      <p className="font-medium">{cert.title}</p>
                      <p className="text-slate-500">
                        {cert.student.firstName} {cert.student.lastName}
                      </p>
                    </div>
                    <span className="rounded-md bg-teal-50 px-2 py-0.5 text-xs text-teal-800">
                      {cert.status}
                    </span>
                  </div>
                )
              )}
              {!data?.recentCertificates?.length && (
                <p className="text-sm text-slate-500">No certificates yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
