"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { assetUrl, formatDate } from "@/lib/utils";

export default function PortfolioPage() {
  const params = useParams<{ studentId: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ["portfolio", params.studentId],
    queryFn: async () => (await api.get(`/features/portfolio/${params.studentId}`)).data.data,
    enabled: !!params.studentId,
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#ecfdf5,_#f8fafc_50%)] dark:bg-slate-950">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-display text-2xl font-semibold text-teal-800 dark:text-teal-300">
          CertChain
        </Link>
        <Button asChild variant="outline">
          <Link href="/verify">Verify</Link>
        </Button>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-6 pb-16">
        {isLoading && <p>Loading portfolio…</p>}
        {error && <p className="text-red-600">Portfolio not found</p>}
        {data && (
          <>
            <div>
              <h1 className="font-display text-4xl font-semibold">{data.student.name}</h1>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                {data.student.university?.name} · {data.student.course || "Student"} · ID{" "}
                {data.student.studentId}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {data.certificates.map(
                (cert: {
                  id: string;
                  title: string;
                  course: string;
                  status: string;
                  issueDate: string;
                  verifyUrl: string;
                  pdfUrl?: string;
                  tokenId?: string;
                }) => (
                  <Card key={cert.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle>{cert.title}</CardTitle>
                        <Badge variant={cert.status === "MINTED" ? "success" : "default"}>
                          {cert.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">
                        {cert.course} · {formatDate(cert.issueDate)}
                      </p>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      <Button asChild size="sm">
                        <a href={cert.verifyUrl} target="_blank" rel="noreferrer">
                          Verify
                        </a>
                      </Button>
                      {cert.pdfUrl && (
                        <Button asChild size="sm" variant="outline">
                          <a href={assetUrl(cert.pdfUrl)} target="_blank" rel="noreferrer">
                            PDF
                          </a>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                            cert.verifyUrl
                          )}`;
                          window.open(url, "_blank");
                        }}
                      >
                        Share LinkedIn
                      </Button>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
