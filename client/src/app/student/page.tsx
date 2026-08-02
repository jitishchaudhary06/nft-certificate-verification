"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BrowserProvider } from "ethers";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { assetUrl, formatDate } from "@/lib/utils";
import { downloadCertificatePng } from "@/lib/certificate-png";

export default function StudentDashboardPage() {
  const { user, metamaskLogin, refreshProfile } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["student-nfts"],
    queryFn: async () => (await api.get("/student-dashboard/nfts")).data.data,
  });

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold">My NFT Certificates</h1>
            <p className="text-slate-500">Download, share, and view on-chain credentials</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {data?.studentPublicId && (
              <Button asChild variant="secondary">
                <Link href={`/portfolio/${data.studentPublicId}`}>Public portfolio</Link>
              </Button>
            )}
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await metamaskLogin();
                  await refreshProfile();
                  toast.success("Wallet connected");
                  refetch();
                } catch (err) {
                  toast.error((err as Error).message);
                }
              }}
            >
              {user?.wallet ? `Connected ${user.wallet.address.slice(0, 8)}…` : "Connect Wallet"}
            </Button>
          </div>
        </div>

        {isLoading && <p>Loading…</p>}

        <div className="grid gap-4 md:grid-cols-2">
          {(data?.data || []).map(
            (cert: {
              id: string;
              title: string;
              course: string;
              status: string;
              verified?: boolean;
              verificationBadge?: string;
              pdfUrl?: string;
              ipfsUrl?: string;
              explorerUrl?: string;
              shareLink?: string;
              tokenId?: string;
              issueDate: string;
              university?: string;
              grade?: string;
              studentName?: string;
            }) => (
              <Card key={cert.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle>{cert.title}</CardTitle>
                    <Badge variant={cert.verified ? "success" : "default"}>
                      {cert.verificationBadge || cert.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500">
                    {cert.course} · {cert.university} · {formatDate(cert.issueDate)}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {cert.pdfUrl && (
                    <Button asChild size="sm" variant="outline">
                      <a href={assetUrl(cert.pdfUrl)} download>
                        Download PDF
                      </a>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await downloadCertificatePng({
                          title: cert.title,
                          studentName: cert.studentName || user?.name || "Student",
                          course: cert.course,
                          university: cert.university || "University",
                          grade: cert.grade,
                          issueDate: formatDate(cert.issueDate),
                          tokenId: cert.tokenId,
                        });
                        toast.success("PNG downloaded");
                      } catch (err) {
                        toast.error((err as Error).message);
                      }
                    }}
                  >
                    Download PNG
                  </Button>
                  {cert.ipfsUrl && (
                    <Button asChild size="sm" variant="outline">
                      <a href={cert.ipfsUrl} target="_blank" rel="noreferrer">
                        Metadata
                      </a>
                    </Button>
                  )}
                  {cert.explorerUrl && (
                    <Button asChild size="sm" variant="secondary">
                      <a href={cert.explorerUrl} target="_blank" rel="noreferrer">
                        Blockchain
                      </a>
                    </Button>
                  )}
                  {cert.shareLink && (
                    <Button
                      size="sm"
                      onClick={async () => {
                        const link = cert.shareLink!.startsWith("http")
                          ? cert.shareLink!
                          : `${window.location.origin}${cert.shareLink}`;
                        await navigator.clipboard.writeText(link);
                        toast.success("Verification link copied");
                      }}
                    >
                      Share Link
                    </Button>
                  )}
                  {cert.shareLink && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const link = cert.shareLink!.startsWith("http")
                          ? cert.shareLink!
                          : `${window.location.origin}${cert.shareLink}`;
                        window.open(
                          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
                          "_blank"
                        );
                      }}
                    >
                      LinkedIn
                    </Button>
                  )}
                  {cert.tokenId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        try {
                          if (!window.ethereum) throw new Error("MetaMask required");
                          const provider = new BrowserProvider(window.ethereum);
                          await provider.send("eth_requestAccounts", []);
                          toast.message("Use your wallet / OpenSea to transfer the NFT token", {
                            description: `Token ID ${cert.tokenId}`,
                          });
                        } catch (err) {
                          toast.error((err as Error).message);
                        }
                      }}
                    >
                      Transfer NFT
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          )}
        </div>

        {!isLoading && !(data?.data || []).length && (
          <Card>
            <CardContent className="p-8 text-center text-slate-500">
              No certificates yet. Ask your university admin to issue one.
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
