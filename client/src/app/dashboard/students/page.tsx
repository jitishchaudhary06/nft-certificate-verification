"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, Label } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const empty = {
  studentId: "",
  firstName: "",
  lastName: "",
  email: "",
  course: "",
  department: "",
  universityId: "",
};

export default function StudentsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(empty);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: universities } = useQuery({
    queryKey: ["universities-options"],
    queryFn: async () => (await api.get("/universities", { params: { limit: 100 } })).data.data,
    enabled: user?.role === "SUPER_ADMIN",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["students", search, page],
    queryFn: async () =>
      (await api.get("/students", { params: { search, page, limit: 10 } })).data.data,
  });

  const createMutation = useMutation({
    mutationFn: () => api.post("/student", form),
    onSuccess: () => {
      toast.success("Student added");
      setForm(empty);
      qc.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (err: unknown) =>
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed"
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/students/${id}`),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["students"] });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData();
      body.append("csv", file);
      if (form.universityId) body.append("universityId", form.universityId);
      return api.post("/students/import/csv", body);
    },
    onSuccess: (res) => {
      toast.success(`Imported ${res.data.data.created} students`);
      qc.invalidateQueries({ queryKey: ["students"] });
    },
  });

  const exportCsv = async () => {
    const res = await api.get("/students/export/csv", { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students.csv";
    a.click();
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold">Students</h1>
            <p className="text-slate-500">Add, import, search, and export students</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCsv}>
              Export CSV
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              Import CSV
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importMutation.mutate(file);
              }}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add Student</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {(["studentId", "firstName", "lastName", "email", "course", "department"] as const).map(
              (key) => (
                <div key={key} className="space-y-2">
                  <Label className="capitalize">{key.replace(/([A-Z])/g, " $1")}</Label>
                  <Input
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              )
            )}
            {user?.role === "SUPER_ADMIN" && (
              <div className="space-y-2">
                <Label>University ID</Label>
                <Input
                  list="uni-list"
                  value={form.universityId}
                  onChange={(e) => setForm({ ...form, universityId: e.target.value })}
                  placeholder="Select or paste university id"
                />
                <datalist id="uni-list">
                  {(universities?.data || []).map((u: { id: string; name: string }) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </datalist>
              </div>
            )}
            <Button className="md:col-span-3" onClick={() => createMutation.mutate()}>
              Save Student
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>Student Directory</CardTitle>
            <Input
              className="max-w-xs"
              placeholder="Search name, email, ID…"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading…</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b text-slate-500">
                        <th className="py-2">Student ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Course</th>
                        <th>Certs</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.data || []).map(
                        (s: {
                          id: string;
                          studentId: string;
                          firstName: string;
                          lastName: string;
                          email: string;
                          course?: string;
                          _count: { certificates: number };
                        }) => (
                          <tr key={s.id} className="border-b border-slate-100">
                            <td className="py-3">{s.studentId}</td>
                            <td className="font-medium">
                              {s.firstName} {s.lastName}
                            </td>
                            <td>{s.email}</td>
                            <td>{s.course || "—"}</td>
                            <td>{s._count.certificates}</td>
                            <td>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteMutation.mutate(s.id)}
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
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    Page {data?.meta?.page} of {data?.meta?.totalPages} · {data?.meta?.total} total
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
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
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
