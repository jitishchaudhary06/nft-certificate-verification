import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(120deg, rgba(15,118,110,0.92), rgba(15,23,42,0.78)), url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=2000&q=80')",
        }}
      />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <p className="font-display text-2xl font-semibold tracking-tight text-white">CertChain</p>
        <div className="flex gap-3">
          <Button asChild variant="secondary">
            <Link href="/verify">Verify</Link>
          </Button>
          <Button asChild className="bg-white text-teal-900 hover:bg-teal-50">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-center px-6 pb-20">
        <h1 className="max-w-3xl font-display text-5xl font-semibold leading-tight text-white md:text-6xl">
          Academic credentials that live on-chain
        </h1>
        <p className="mt-5 max-w-xl text-lg text-teal-50/90">
          Universities issue tamper-proof NFT certificates. Students own them. Employers verify
          instantly.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="bg-white text-teal-900 hover:bg-teal-50">
            <Link href="/register">Get started</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">
            <Link href="/verify">Verify a certificate</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
