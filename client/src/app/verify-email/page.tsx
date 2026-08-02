"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function VerifyEmailInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const [message, setMessage] = useState("Verifying…");

  useEffect(() => {
    if (!token) {
      setMessage("Missing verification token");
      return;
    }
    api
      .get(`/auth/verify-email?token=${token}`)
      .then((res) => setMessage(res.data.message))
      .catch(() => setMessage("Verification failed"));
  }, [token]);

  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Email verification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>{message}</p>
        <Button asChild>
          <Link href="/login">Continue to login</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Suspense>
        <VerifyEmailInner />
      </Suspense>
    </div>
  );
}
