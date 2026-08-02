"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, Card, CardContent, CardHeader, CardTitle, Label } from "@/components/ui/card";
import { assetUrl, formatDate, shortenAddress } from "@/lib/utils";

export default function EmployerVerifyPage() {
  const [filters, setFilters] = useState({
    q: "",
    tokenId: "",
    txHash: "",
    walletAddress: "",
    studentName: "",
  });
  const [submitted, setSubmitted] = useState(filters);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["employer-search", submitted],
    queryFn: async () => (await api.get("/verify", { params: submitted })).data.data,
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#ecfdf5,_#f8fafc_50%)]">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-display text-2xl font-semibold text-teal-800">
          CertChain
        </Link>
        <Button asChild variant="outline">
          <Link href="/login">Admin login</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 pb-16">
        <div>
          <h1 className="font-display text-4xl font-semibold">Employer Verification</h1>
          <p className="mt-2 text-slate-600">
            Search by QR / Token ID, transaction hash, wallet, or student name
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search certificates</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {(
              [
                ["q", "General query"],
                ["tokenId", "Token ID"],
                ["txHash", "Transaction hash"],
                ["walletAddress", "Wallet address"],
                ["studentName", "Student name"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <Input
                  value={filters[key]}
                  onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                />
              </div>
            ))}
            <Button
              className="md:col-span-2"
              onClick={() => {
                setSubmitted({ ...filters });
                refetch();
              }}
            >
              {isFetching ? "Searching…" : "Search"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {(data?.data || []).map(
            (item: {
              id?: string;
              tokenId?: string;
              studentName?: string;
              university?: string;
              course?: string;
              verified?: boolean;
              verificationBadge?: string;
              issuer?: string;
              owner?: string;
              mintDate?: string;
              transactionHash?: string;
              ipfsUrl?: string;
              pdfUrl?: string;
            }) => (
              <Card key={item.id || item.tokenId}>
                <CardContent className="space-y-3 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-display text-xl font-semibold">
                      {item.studentName || "Unknown student"}
                    </h2>
                    <Badge variant={item.verified ? "success" : "danger"}>
                      {item.verificationBadge || (item.verified ? "Verified ✅" : "Unverified")}
                    </Badge>
                  </div>
                  <div className="grid gap-2 text-sm md:grid-cols-2">
                    <p>
                      <span className="text-slate-500">Issuer:</span> {item.issuer || item.university}
                    </p>
                    <p>
                      <span className="text-slate-500">Course:</span> {item.course}
                    </p>
                    <p>
                      <span className="text-slate-500">Owner:</span>{" "}
                      {item.owner ? shortenAddress(item.owner) : "—"}
                    </p>
                    <p>
                      <span className="text-slate-500">Mint date:</span>{" "}
                      {item.mintDate ? formatDate(item.mintDate) : "—"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.tokenId && (
                      <Button asChild size="sm">
                        <Link href={`/verify/${item.tokenId}`}>Open verification</Link>
                      </Button>
                    )}
                    {item.pdfUrl && (
                      <Button asChild size="sm" variant="outline">
                        <a href={assetUrl(item.pdfUrl)} target="_blank" rel="noreferrer">
                          PDF
                        </a>
                      </Button>
                    )}
                    {item.ipfsUrl && (
                      <Button asChild size="sm" variant="outline">
                        <a href={item.ipfsUrl} target="_blank" rel="noreferrer">
                          Metadata
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          )}
          {!isFetching && !(data?.data || []).length && (
            <p className="text-slate-500">No results yet. Enter a search term above.</p>
          )}
        </div>
      </main>
    </div>
  );
}
