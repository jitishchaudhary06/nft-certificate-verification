"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BrowserProvider } from "ethers";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, Card, CardContent, CardHeader, CardTitle, Label } from "@/components/ui/card";
import { api } from "@/lib/api";
import { assetUrl, formatDate } from "@/lib/utils";

export default function CertificatesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    studentId: "",
    title: "Certificate of Completion",
    course: "",
    grade: "",
    description: "",
    template: "CLASSIC",
    expiresAt: "",
    requiresApproval: false,
  });

  const { data: students } = useQuery({
    queryKey: ["students-options"],
    queryFn: async () => (await api.get("/students", { params: { limit: 100 } })).data.data,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["certificates", search],
    queryFn: async () =>
      (await api.get("/certificates", { params: { search, limit: 20 } })).data.data,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/certificate", {
        ...form,
        expiresAt: form.expiresAt || null,
      }),
    onSuccess: () => {
      toast.success("Certificate generated");
      qc.invalidateQueries({ queryKey: ["certificates"] });
    },
    onError: (err: unknown) =>
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed"
      ),
  });

  const actionMutation = useMutation({
    mutationFn: async ({
      id,
      action,
      walletAddress,
      template,
    }: {
      id: string;
      action:
        | "pdf"
        | "ipfs"
        | "mint"
        | "email"
        | "revoke"
        | "delete"
        | "approve"
        | "reject"
        | "submit"
        | "renew"
        | "template";
      walletAddress?: string;
      template?: string;
    }) => {
      if (action === "pdf") return api.post(`/certificates/${id}/generate-pdf`);
      if (action === "ipfs") return api.post(`/certificates/${id}/ipfs`);
      if (action === "email") return api.post(`/certificates/${id}/email`);
      if (action === "revoke")
        return api.post(`/certificates/${id}/revoke`, { reason: "Administrative revoke" });
      if (action === "delete") return api.delete(`/certificates/${id}`);
      if (action === "approve") return api.post(`/features/certificates/${id}/approve`);
      if (action === "reject")
        return api.post(`/features/certificates/${id}/reject`, {
          reason: "Needs corrections before minting",
        });
      if (action === "submit") return api.post(`/features/certificates/${id}/submit-approval`);
      if (action === "renew") {
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        return api.post(`/features/certificates/${id}/renew`, { expiresAt });
      }
      if (action === "template")
        return api.post(`/features/certificates/${id}/template`, { template: template || "MODERN" });
      return api.post("/mint", { certificateId: id, walletAddress });
    },
    onSuccess: (_res, vars) => {
      toast.success(`${vars.action} completed`);
      qc.invalidateQueries({ queryKey: ["certificates"] });
    },
    onError: (err: unknown) =>
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Action failed"
      ),
  });

  const bulkMintSelected = async () => {
    try {
      if (!window.ethereum) throw new Error("MetaMask required");
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();
      const ready = (data?.data || []).filter(
        (c: { status: string; approvalStatus?: string }) =>
          c.status !== "MINTED" && c.status !== "REVOKED" && (c.approvalStatus || "APPROVED") === "APPROVED"
      );
      if (!ready.length) {
        toast.message("No approved certificates ready to mint");
        return;
      }
      const res = await api.post("/features/bulk-mint", {
        items: ready.slice(0, 10).map((c: { id: string }) => ({
          certificateId: c.id,
          walletAddress,
        })),
      });
      toast.success(`Bulk mint: ${res.data.data.succeeded} ok, ${res.data.data.failed} failed`);
      qc.invalidateQueries({ queryKey: ["certificates"] });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const mintWithWallet = async (id: string) => {
    try {
      if (!window.ethereum) throw new Error("MetaMask required to pick recipient wallet");
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();
      actionMutation.mutate({ id, action: "mint", walletAddress });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold">Certificates</h1>
          <p className="text-slate-500">Generate PDF, upload IPFS, mint NFT, approve, and email</p>
        </div>
        <div className="flex justify-end">
          <Button variant="secondary" onClick={bulkMintSelected}>
            Bulk mint approved
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generate Certificate</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Student</Label>
              <select
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              >
                <option value="">Select student</option>
                {(students?.data || []).map(
                  (s: { id: string; firstName: string; lastName: string; studentId: string }) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.studentId})
                    </option>
                  )
                )}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Course</Label>
              <Input value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Grade</Label>
              <Input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Template</Label>
              <select
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={form.template}
                onChange={(e) => setForm({ ...form, template: e.target.value })}
              >
                <option value="CLASSIC">Classic</option>
                <option value="MODERN">Modern</option>
                <option value="ELEGANT">Elegant</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Expires at (optional)</Label>
              <Input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={form.requiresApproval}
                onChange={(e) => setForm({ ...form, requiresApproval: e.target.checked })}
              />
              Require admin approval before mint
            </label>
            <Button className="md:col-span-2" onClick={() => createMutation.mutate()}>
              Generate (PDF + QR)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>All Certificates</CardTitle>
            <Input
              className="max-w-xs"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && <p>Loading…</p>}
            {(data?.data || []).map(
              (cert: {
                id: string;
                title: string;
                course: string;
                status: string;
                certificateNumber: string;
                issueDate: string;
                pdfUrl?: string;
                tokenId?: string;
                transactionHash?: string;
                template?: string;
                approvalStatus?: string;
                expiresAt?: string | null;
                student: { firstName: string; lastName: string };
                university: { name: string };
              }) => (
                <div
                  key={cert.id}
                  className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{cert.title}</p>
                      <p className="text-sm text-slate-500">
                        {cert.student.firstName} {cert.student.lastName} · {cert.course} ·{" "}
                        {cert.university.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {cert.certificateNumber} · {formatDate(cert.issueDate)} ·{" "}
                        {cert.template || "CLASSIC"}
                        {cert.expiresAt ? ` · expires ${formatDate(cert.expiresAt)}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant={
                          cert.status === "MINTED"
                            ? "success"
                            : cert.status === "REVOKED" || cert.status === "EXPIRED"
                              ? "danger"
                              : "default"
                        }
                      >
                        {cert.status}
                      </Badge>
                      {cert.approvalStatus && cert.approvalStatus !== "APPROVED" && (
                        <Badge variant={cert.approvalStatus === "REJECTED" ? "danger" : "default"}>
                          {cert.approvalStatus}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {cert.pdfUrl && (
                      <Button asChild size="sm" variant="outline">
                        <a href={assetUrl(cert.pdfUrl)} target="_blank" rel="noreferrer">
                          Preview PDF
                        </a>
                      </Button>
                    )}
                    <Button size="sm" variant="secondary" onClick={() => actionMutation.mutate({ id: cert.id, action: "pdf" })}>
                      Regen PDF
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => actionMutation.mutate({ id: cert.id, action: "ipfs" })}>
                      IPFS
                    </Button>
                    <Button size="sm" onClick={() => mintWithWallet(cert.id)}>
                      Mint NFT
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => actionMutation.mutate({ id: cert.id, action: "submit" })}
                    >
                      Submit approval
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => actionMutation.mutate({ id: cert.id, action: "approve" })}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => actionMutation.mutate({ id: cert.id, action: "reject" })}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        actionMutation.mutate({ id: cert.id, action: "template", template: "MODERN" })
                      }
                    >
                      Modern template
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => actionMutation.mutate({ id: cert.id, action: "renew" })}
                    >
                      Renew +1y
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => actionMutation.mutate({ id: cert.id, action: "email" })}>
                      Email
                    </Button>
                    {cert.tokenId && (
                      <Button asChild size="sm" variant="outline">
                        <a href={`/verify/${cert.tokenId}`} target="_blank" rel="noreferrer">
                          Verify
                        </a>
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => actionMutation.mutate({ id: cert.id, action: "revoke" })}>
                      Revoke
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => actionMutation.mutate({ id: cert.id, action: "delete" })}>
                      Delete
                    </Button>
                  </div>
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
