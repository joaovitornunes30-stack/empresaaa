import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="font-display text-2xl font-bold text-primary-dark">
            Aivy
          </span>
        </div>
        {children}
      </div>
      <p className="mt-8 text-xs text-foreground/40">
        <Link href="/termos" className="hover:text-foreground/70">Termos de Uso</Link>
        {" · "}
        <Link href="/privacidade" className="hover:text-foreground/70">Política de Privacidade</Link>
      </p>
    </div>
  );
}
