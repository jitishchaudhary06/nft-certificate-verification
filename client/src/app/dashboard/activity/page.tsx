"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function ActivityLogsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["activity-logs", search, page],
    queryFn: async () =>
      (await api.get("/features/activity-logs", { params: { search, page, limit: 20 } })).data.data,
  });

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold">Audit Logs</h1>
          <p className="text-slate-500">Who minted, revoked, approved, and when</p>
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>Recent activity</CardTitle>
            <Input
              className="max-w-xs"
              placeholder="Search action…"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && <p>Loading…</p>}
            {(data?.data || []).map(
              (log: {
                id: string;
                action: string;
                entity?: string;
                createdAt: string;
                user?: { name: string; email: string };
              }) => (
                <div
                  key={log.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 text-sm dark:border-slate-800"
                >
                  <div>
                    <p className="font-medium">{log.action.replace(/_/g, " ")}</p>
                    <p className="text-slate-500">
                      {log.user?.name || "System"} · {log.entity || "—"}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(log.createdAt)}</span>
                </div>
              )
            )}
            <div className="flex justify-between pt-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= (data?.meta?.totalPages || 1)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
