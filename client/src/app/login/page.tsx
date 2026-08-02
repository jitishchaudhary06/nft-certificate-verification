"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Label } from "@/components/ui/card";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login, metamaskLogin } = useAuth();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormData) => {
    try {
      await login(values.email, values.password);
      toast.success("Welcome back");
      const cached = localStorage.getItem("user");
      const role = cached ? (JSON.parse(cached).role as string) : "SUPER_ADMIN";
      if (role === "STUDENT") router.push("/student");
      else if (role === "EMPLOYER") router.push("/verify");
      else router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Login failed";
      toast.error(message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#ccfbf1,_#f8fafc_55%)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Sign in to CertChain</CardTitle>
          <CardDescription>Email, Google, or MetaMask authentication</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
            </div>
            <Button className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <Button
            variant="outline"
            className="w-full"
            type="button"
            onClick={async () => {
              try {
                await metamaskLogin();
                toast.success("MetaMask connected");
                router.push("/dashboard");
              } catch (err: unknown) {
                toast.error((err as Error).message || "MetaMask login failed");
              }
            }}
          >
            Continue with MetaMask
          </Button>

          <div className="flex justify-between text-sm text-slate-600">
            <Link href="/forgot-password" className="hover:text-teal-700">
              Forgot password?
            </Link>
            <Link href="/register" className="hover:text-teal-700">
              Create account
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
