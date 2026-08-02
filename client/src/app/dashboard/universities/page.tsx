"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, Label } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function UniversitiesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", code: "", email: "", website: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["universities", search],
    queryFn: async () =>
      (await api.get("/universities", { params: { search, limit: 20 } })).data.data,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => body.append(k, v));
      return api.post("/universities", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success("University created");
      setForm({ name: "", code: "", email: "", website: "" });
      qc.invalidateQueries({ queryKey: ["universities"] });
    },
    onError: (err: unknown) => {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/universities/${id}`),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["universities"] });
    },
  });

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold">Universities</h1>
          <p className="text-slate-500">Create, update, and assign university admins</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create University</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </div>
            <Button className="md:col-span-2" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              Create
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>All Universities</CardTitle>
            <Input
              className="max-w-xs"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading…</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-slate-500">
                      <th className="py-2">Name</th>
                      <th>Code</th>
                      <th>Students</th>
                      <th>Certificates</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.data || []).map(
                      (uni: {
                        id: string;
                        name: string;
                        code: string;
                        _count: { students: number; certificates: number };
                      }) => (
                        <tr key={uni.id} className="border-b border-slate-100">
                          <td className="py-3 font-medium">{uni.name}</td>
                          <td>{uni.code}</td>
                          <td>{uni._count.students}</td>
                          <td>{uni._count.certificates}</td>
                          <td>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteMutation.mutate(uni.id)}
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
