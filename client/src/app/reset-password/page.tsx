"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, Label } from "@/components/ui/card";

const schema = z.object({
  password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
});

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<{ password: string }>({ resolver: zodResolver(schema) });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Reset password</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={handleSubmit(async (values) => {
            try {
              await api.post("/auth/reset-password", { token, password: values.password });
              toast.success("Password updated");
              router.push("/login");
            } catch {
              toast.error("Reset failed");
            }
          })}
        >
          <div className="space-y-2">
            <Label>New password</Label>
            <Input type="password" {...register("password")} />
          </div>
          <Button className="w-full" disabled={isSubmitting || !token}>
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Suspense>
        <ResetForm />
      </Suspense>
    </div>
  );
}
