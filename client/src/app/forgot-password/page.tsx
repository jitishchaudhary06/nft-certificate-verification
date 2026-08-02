"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Label } from "@/components/ui/card";

const schema = z.object({ email: z.string().email() });

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<{ email: string }>({ resolver: zodResolver(schema) });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Forgot password</CardTitle>
          <CardDescription>We will email you a reset link</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={handleSubmit(async (values) => {
              try {
                const { data } = await api.post("/auth/forgot-password", values);
                toast.success(data.message);
              } catch {
                toast.error("Request failed");
              }
            })}
          >
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...register("email")} />
            </div>
            <Button className="w-full" disabled={isSubmitting}>
              Send reset link
            </Button>
          </form>
          <Link href="/login" className="mt-4 block text-center text-sm text-teal-700">
            Back to login
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
