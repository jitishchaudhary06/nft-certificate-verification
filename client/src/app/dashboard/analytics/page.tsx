"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => (await api.get("/features/analytics")).data.data,
  });

  const max = Math.max(1, ...(data?.byStatus || []).map((s: { count: number }) => s.count));

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold">Analytics</h1>
          <p className="text-slate-500">Issuance, minting, approvals, and network status</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Issued (30d)", data?.issuedLast30],
            ["Minted (30d)", data?.mintedLast30],
            ["Pending approvals", data?.pendingApprovals],
            ["Expiring soon", data?.expiringSoon],
          ].map(([label, value]) => (
            <Card key={String(label)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-500">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{isLoading ? "…" : value ?? 0}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Certificates by status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.byStatus || []).map((row: { status: string; count: number }) => (
              <div key={row.status}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{row.status}</span>
                  <span>{row.count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-teal-700"
                    style={{ width: `${(row.count / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {!data?.byStatus?.length && !isLoading && (
              <p className="text-sm text-slate-500">No certificate data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Network</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm md:grid-cols-2">
            <p>Network: {data?.network?.name || "Polygon Amoy"}</p>
            <p>Chain ID: {data?.network?.chainId || "—"}</p>
            <p>Contract: {data?.network?.contractAddress || "Not configured"}</p>
            <p className="md:col-span-2 break-all">RPC: {data?.network?.rpcUrl || "—"}</p>
            {data?.network?.switchHint && (
              <p className="md:col-span-2 text-slate-500">{data.network.switchHint}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
