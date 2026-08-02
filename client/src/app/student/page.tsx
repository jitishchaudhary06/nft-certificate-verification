"use client";

import { useQuery } from "@tanstack/react-query";
import { BrowserProvider } from "ethers";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { assetUrl, formatDate } from "@/lib/utils";

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
                        await navigator.clipboard.writeText(
                          cert.shareLink!.startsWith("http")
                            ? cert.shareLink!
                            : `${window.location.origin}${cert.shareLink}`
                        );
                        toast.success("Verification link copied");
                      }}
                    >
                      Share Link
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
