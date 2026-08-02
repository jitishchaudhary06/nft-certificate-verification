"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { assetUrl, formatDate, shortenAddress } from "@/lib/utils";

export default function VerifyTokenPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const { data, isLoading, error } = useQuery({
    queryKey: ["verify", token],
    queryFn: async () => (await api.get(`/verify/${token}`)).data.data,
    enabled: !!token,
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
        {isLoading && <p>Loading verification…</p>}
        {error && <p className="text-red-600">Certificate not found</p>}
        {data && (
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="font-display text-3xl">{data.studentName}</CardTitle>
                <p className="text-slate-500">{data.university}</p>
              </div>
              <Badge variant={data.verified ? "success" : "danger"} className="text-sm">
                {data.verificationBadge || (data.verified ? "Verified ✅" : "Not verified")}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 md:grid-cols-2">
                <Info label="Course" value={data.course} />
                <Info label="Grade" value={data.grade || "—"} />
                <Info label="Issue Date" value={data.issueDate ? formatDate(data.issueDate) : "—"} />
                <Info
                  label="Expires"
                  value={data.expiresAt ? formatDate(data.expiresAt) : "No expiry"}
                />
                <Info label="Approval" value={data.approvalStatus || "APPROVED"} />
                <Info label="Token ID" value={data.tokenId || token} />
                <Info
                  label="Wallet Address"
                  value={data.walletAddress ? shortenAddress(data.walletAddress, 6) : "—"}
                />
                <Info
                  label="Transaction Hash"
                  value={data.transactionHash ? shortenAddress(data.transactionHash, 8) : "—"}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                {data.pdfUrl && (
                  <Button asChild>
                    <a href={assetUrl(data.pdfUrl)} target="_blank" rel="noreferrer">
                      Certificate PDF
                    </a>
                  </Button>
                )}
                {data.nftImageUrl && (
                  <Button asChild variant="outline">
                    <a href={data.nftImageUrl} target="_blank" rel="noreferrer">
                      NFT Image / IPFS
                    </a>
                  </Button>
                )}
                {data.ipfsUrl && (
                  <Button asChild variant="outline">
                    <a href={data.ipfsUrl} target="_blank" rel="noreferrer">
                      Metadata IPFS
                    </a>
                  </Button>
                )}
                {data.explorerUrl && (
                  <Button asChild variant="secondary">
                    <a href={data.explorerUrl} target="_blank" rel="noreferrer">
                      Blockchain Explorer
                    </a>
                  </Button>
                )}
                {data.shareLink || data.tokenId ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const link = `${window.location.origin}/verify/${data.tokenId || token}`;
                      window.open(
                        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
                        "_blank"
                      );
                    }}
                  >
                    Share LinkedIn
                  </Button>
                ) : null}
              </div>

              {data.qrCodeUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={assetUrl(data.qrCodeUrl)}
                  alt="Verification QR"
                  className="h-32 w-32 rounded-lg border bg-white p-2"
                />
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-medium break-all">{value}</p>
    </div>
  );
}
