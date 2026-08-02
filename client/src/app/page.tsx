import Link from "next/link";
import { Button } from "@/components/ui/button";

const steps = [
  {
    title: "Issue",
    text: "Universities generate certificates with PDF, QR, and academic metadata in one flow.",
  },
  {
    title: "Mint",
    text: "Credentials are pinned to IPFS and minted as ERC-721 NFTs on Polygon Amoy.",
  },
  {
    title: "Verify",
    text: "Employers confirm authenticity instantly by token ID, wallet, or QR scan.",
  },
];

const audiences = [
  {
    title: "Universities",
    text: "Issue tamper-proof certificates at scale with admin dashboards, CSV import, and mint controls.",
    href: "/register",
    cta: "Start issuing",
  },
  {
    title: "Students",
    text: "Own your credentials in a wallet. Download PDF, share verification links, and transfer NFTs.",
    href: "/login",
    cta: "Open student access",
  },
  {
    title: "Employers",
    text: "Search by name, wallet, transaction hash, or token ID and see a clear verified status.",
    href: "/verify",
    cta: "Verify now",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* HERO — one composition */}
      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=2400&q=80"
            alt="University graduation ceremony"
            className="hero-media h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(11,79,74,0.94)_0%,rgba(15,23,42,0.72)_55%,rgba(11,18,32,0.55)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(20,184,166,0.22),transparent_50%)]" />
        </div>

        <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <p className="font-display text-2xl font-semibold tracking-tight text-white md:text-3xl">
            CertChain
          </p>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Button asChild variant="secondary" className="bg-white/95 text-teal-950 hover:bg-white">
              <Link href="/verify">Verify</Link>
            </Button>
            <Button asChild className="bg-teal-700 text-white hover:bg-teal-800">
              <Link href="/login">Sign in</Link>
            </Button>
          </nav>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-88px)] max-w-6xl flex-col justify-center px-6 pb-24 pt-10">
          <p className="animate-fade-up font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            CertChain
          </p>
          <h1 className="animate-fade-up-delay mt-4 max-w-3xl font-display text-3xl font-medium leading-tight text-teal-50 sm:text-4xl md:text-5xl">
            Academic credentials that live on-chain
          </h1>
          <p className="animate-fade-up-delay-2 mt-5 max-w-xl text-base text-teal-50/85 sm:text-lg">
            Universities issue tamper-proof NFT certificates. Students own them. Employers verify
            instantly.
          </p>
          <div className="animate-fade-up-delay-2 mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white text-teal-950 hover:bg-teal-50">
              <Link href="/register">Get started</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/35 bg-transparent text-white hover:bg-white/10"
            >
              <Link href="/verify">Verify a certificate</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-slate-200/80 bg-[var(--surface)]">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            How it works
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold text-slate-900 md:text-4xl">
            From campus record to verifiable NFT
          </h2>
          <p className="mt-4 max-w-2xl text-slate-600">
            A clean path for issuing, storing, and checking academic credentials without paperwork
            friction.
          </p>

          <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
            {steps.map((step, index) => (
              <li key={step.title} className="relative">
                <span className="font-display text-5xl font-semibold text-teal-700/20">
                  0{index + 1}
                </span>
                <h3 className="mt-2 font-display text-2xl font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-3 text-slate-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* BUILT FOR */}
      <section className="bg-[linear-gradient(180deg,#f4f7f6_0%,#e8f5f2_100%)]">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            Built for every role
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold text-slate-900 md:text-4xl">
            One platform. Three clear journeys.
          </h2>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {audiences.map((item) => (
              <article
                key={item.title}
                className="border-t-2 border-teal-700 pt-6 transition-transform duration-300 hover:-translate-y-1"
              >
                <h3 className="font-display text-2xl font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-3 min-h-[4.5rem] text-slate-600">{item.text}</p>
                <Link
                  href={item.href}
                  className="mt-5 inline-flex text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
                >
                  {item.cta} →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST / ON-CHAIN */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, rgba(20,184,166,0.35), transparent 40%), radial-gradient(circle at 85% 70%, rgba(15,118,110,0.25), transparent 35%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center md:py-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-300">
              On-chain trust
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
              Designed for proof, not just PDFs
            </h2>
            <p className="mt-4 text-slate-300">
              Every minted certificate carries IPFS metadata, a transaction hash, and a public
              verification page so anyone can confirm the issuer and status.
            </p>
          </div>
          <ul className="space-y-5 text-slate-200">
            {[
              "ERC-721 certificates on Polygon Amoy",
              "PDF + metadata stored via IPFS / Pinata",
              "QR-linked public verification pages",
              "Role-based admin, university, and student access",
            ].map((line) => (
              <li key={line} className="flex gap-3 border-b border-white/10 pb-4">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-400" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[var(--surface)]">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <div className="float-soft rounded-3xl bg-[linear-gradient(135deg,#0f766e,#134e4a_55%,#0f172a)] px-8 py-14 text-white md:px-14">
            <h2 className="max-w-2xl font-display text-3xl font-semibold md:text-4xl">
              Ready to issue your next certificate on-chain?
            </h2>
            <p className="mt-4 max-w-xl text-teal-50/85">
              Create an account, connect your university workflow, and start minting verifiable
              credentials.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-teal-950 hover:bg-teal-50">
                <Link href="/register">Create account</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
              >
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-2xl font-semibold text-white">CertChain</p>
            <p className="mt-3 max-w-sm text-sm text-slate-400">
              NFT Certificate Generator for universities, students, and employers — built with
              Next.js, Express, Prisma, and Polygon.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Product</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/verify" className="hover:text-teal-300">
                  Verify certificate
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-teal-300">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-teal-300">
                  Register
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-teal-300">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Resources</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/jitishchaudhary06/nft-certificate-verification"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-teal-300"
                >
                  GitHub repository
                </a>
              </li>
              <li>
                <a
                  href="https://nft-certificate-verification.onrender.com/api/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-teal-300"
                >
                  API docs
                </a>
              </li>
              <li>
                <a
                  href="https://nft-certificate-verification.onrender.com/api/health"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-teal-300"
                >
                  API health
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} CertChain. All rights reserved.</p>
            <p>Polygon Amoy · IPFS · JWT Auth</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
