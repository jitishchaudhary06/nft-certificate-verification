"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { assetUrl, formatDate, shortenAddress } from "@/lib/utils";

export default function VerifyCertificateByIdPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ["verify-cert", id],
    queryFn: async () => (await api.get(`/verify/certificate/${id}`)).data.data,
    enabled: !!id,
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#ecfdf5,_#f8fafc_50%)]">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-display text-2xl font-semibold text-teal-800">
          CertChain
        </Link>
        <Button asChild variant="outline">
          <Link href="/verify">Search more</Link>
        </Button>
      </header>
      <main className="mx-auto max-w-4xl px-6 pb-16">
        {isLoading && <p>Loading…</p>}
        {error && <p className="text-red-600">Certificate not found</p>}
        {data && (
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="font-display text-3xl">{data.studentName}</CardTitle>
                <p className="text-slate-500">{data.university}</p>
              </div>
              <Badge variant={data.verified ? "success" : "danger"}>
                {data.verificationBadge}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                {data.course} · Grade {data.grade || "—"} · Issued{" "}
                {data.issueDate ? formatDate(data.issueDate) : "—"}
              </p>
              {data.walletAddress && (
                <p className="text-sm">Wallet: {shortenAddress(data.walletAddress, 6)}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {data.pdfUrl && (
                  <Button asChild>
                    <a href={assetUrl(data.pdfUrl)} target="_blank" rel="noreferrer">
                      PDF
                    </a>
                  </Button>
                )}
                {data.tokenId && (
                  <Button asChild variant="outline">
                    <Link href={`/verify/${data.tokenId}`}>Open NFT verification</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
